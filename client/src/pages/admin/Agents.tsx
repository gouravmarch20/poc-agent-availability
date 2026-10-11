import { useEffect, useRef, useState } from 'react';
import * as agentsApi from '../../services/agents';
import { useApiRequest } from '../../hooks/useApiRequest';
import { EmptyState, LoadingState } from '../../components/Feedback';
import { Agent } from '../../types';
import { ApiError } from '../../api';
import MoreMenu from '../../components/MoreMenu';
import AgentBadges from '../../components/AgentBadges';
import { Button, Input, Textarea } from '../../components/Controls';
import styles from './Agents.module.css';

const empty = {
  name: '',
  phone: '',
  address: '',
  badges: '',
  bio: '',
  experienceYears: '',
  languages: '',
  amount: 0,
  currency: 'INR',
};
const MAX_BIO_LENGTH = 600;
const MAX_EXPERIENCE_YEARS = 60;
const MAX_AGENT_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface NewAgentPhoto {
  file: File;
  preview: string;
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newPhotos, setNewPhotos] = useState<NewAgentPhoto[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  // Photo edits stay in this draft until Save: removed ids, chosen cover, and files waiting to upload (newPhotos).
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const deletePending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const newPhotoUrls = useRef<string[]>([]);
  const { execute, clearError } = useApiRequest();
  const [loading, setLoading] = useState(true);
  const editingAgent = agents.find((agent) => agent.id === editing);
  const existingPhotos = editingAgent ? [...editingAgent.images].sort((a, b) => a.order - b.order) : [];
  const activeExisting = existingPhotos.filter((image) => !removedIds.includes(image.fileId));
  const activeKeys = [...activeExisting.map((image) => image.fileId), ...newPhotos.map((photo) => photo.preview)];
  const originalCoverId = existingPhotos.find((image) => image.isCover)?.fileId ?? existingPhotos[0]?.fileId;
  const effectiveCoverKey = coverKey && activeKeys.includes(coverKey)
    ? coverKey
    : originalCoverId && activeKeys.includes(originalCoverId) ? originalCoverId : activeKeys[0];
  const photosDirty = removedIds.length > 0 || newPhotos.length > 0 || (Boolean(editingAgent) && effectiveCoverKey !== originalCoverId);

  useEffect(() => () => newPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function clearNewPhotos() {
    newPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    newPhotoUrls.current = [];
    setNewPhotos([]);
    setRemovedIds([]);
    setCoverKey(null);
  }

  function addPhotos(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    const photoError = activeKeys.length + files.length > MAX_AGENT_IMAGES
      ? `An agent can have up to ${MAX_AGENT_IMAGES} photos.`
      : validatePhotoFiles(files);
    if (photoError) {
      setFieldErrors((current) => ({ ...current, photos: photoError }));
      return;
    }
    const previews = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    newPhotoUrls.current.push(...previews.map((photo) => photo.preview));
    setNewPhotos((current) => [...current, ...previews]);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.photos;
      return next;
    });
  }

  function toggleRemoved(fileId: string) {
    setRemovedIds((current) => (current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId]));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.photos;
      return next;
    });
  }

  function selectNewPhotos(fileList: FileList | null) {
    clearNewPhotos();
    const files = Array.from(fileList ?? []).slice(0, MAX_AGENT_IMAGES);
    const previews = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    newPhotoUrls.current = previews.map((photo) => photo.preview);
    setNewPhotos(previews);
    const error = fileList && fileList.length > MAX_AGENT_IMAGES
      ? `Choose no more than ${MAX_AGENT_IMAGES} photos.`
      : validatePhotoFiles(files);
    setFieldErrors((current) => {
      const next = { ...current };
      if (error) next.photos = error;
      else delete next.photos;
      return next;
    });
    clearError();
  }

  function validatePhotoFiles(files: File[], existingCount = 0): string | null {
    if (existingCount + files.length > MAX_AGENT_IMAGES) return `An agent can have up to ${MAX_AGENT_IMAGES} photos.`;
    if (files.some((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) return 'Use JPEG, PNG or WebP photos.';
    if (files.some((file) => file.size > MAX_IMAGE_BYTES)) return 'Each photo must be 5 MB or smaller.';
    return null;
  }

  function removeNewPhoto(index: number) {
    const photo = newPhotos[index];
    if (!photo) return;
    URL.revokeObjectURL(photo.preview);
    newPhotoUrls.current = newPhotoUrls.current.filter((url) => url !== photo.preview);
    setNewPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.photos;
      return next;
    });
  }

  async function load() {
    const data = await execute(() => agentsApi.listAgents());
    setAgents(data.agents);
  }

  useEffect(() => {
    const controller = new AbortController();
    execute(() => agentsApi.listAgents(controller.signal))
      .then((data) => setAgents(data.agents))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [execute]);

  function payload() {
    return {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      badges: splitList(form.badges),
      bio: form.bio.trim(),
      experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
      languages: splitList(form.languages),
      pricing: { amount: Number(form.amount), currency: form.currency || 'INR' },
    };
  }

  function updateField(field: keyof typeof empty, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    clearError();
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};
    const badges = payload().badges;

    if (!form.name.trim()) nextErrors.name = 'Enter an agent name.';
    else if (form.name.trim().length > 80) nextErrors.name = 'Name must be 80 characters or fewer.';
    if (form.phone.trim().length < 5) nextErrors.phone = 'Enter a phone number with at least 5 characters.';
    else if (form.phone.trim().length > 20) nextErrors.phone = 'Phone must be 20 characters or fewer.';
    if (form.address.length > 300) nextErrors.address = 'Address must be 300 characters or fewer.';
    if (badges.length > 20) nextErrors.badges = 'Enter no more than 20 badges.';
    else if (badges.some((badge) => badge.length > 40)) nextErrors.badges = 'Each badge must be 40 characters or fewer.';
    if (form.bio.length > MAX_BIO_LENGTH) nextErrors.bio = `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`;
    if (form.experienceYears !== '') {
      const years = Number(form.experienceYears);
      if (!Number.isInteger(years) || years < 0 || years > MAX_EXPERIENCE_YEARS) {
        nextErrors.experienceYears = `Enter whole years between 0 and ${MAX_EXPERIENCE_YEARS}.`;
      }
    }
    const languages = splitList(form.languages);
    if (languages.length > 10) nextErrors.languages = 'Enter no more than 10 languages.';
    else if (languages.some((language) => language.length > 30)) nextErrors.languages = 'Each language must be 30 characters or fewer.';
    if (!Number.isFinite(form.amount) || form.amount < 0) nextErrors.amount = 'Amount must be zero or greater.';
    if (form.currency && (form.currency.length < 3 || form.currency.length > 6)) {
      nextErrors.currency = 'Currency must be 3 to 6 characters.';
    }
    if (!editing && newPhotos.length === 0) nextErrors.photos = 'Add at least one photo for the new agent.';
    const photoError = validatePhotoFiles(newPhotos.map((photo) => photo.file));
    if (!editing && photoError) nextErrors.photos = photoError;
    if (editing && activeKeys.length === 0) {
      nextErrors.photos = 'Keep at least one photo for this agent.';
    }

    return nextErrors;
  }

  // Upload first so the agent never drops to zero photos, then remove, then fix order and cover.
  async function savePhotoDraft(agentId: string, agent: Agent) {
    let newIds: string[] = [];
    if (newPhotos.length > 0) {
      const formData = new FormData();
      newPhotos.forEach((photo) => formData.append('images', photo.file));
      const uploaded = await execute(() => agentsApi.uploadAgentImages(agentId, formData));
      const before = new Set(agent.images.map((image) => image.fileId));
      newIds = uploaded.agent.images
        .filter((image) => !before.has(image.fileId))
        .sort((a, b) => a.order - b.order)
        .map((image) => image.fileId);
    }
    for (const fileId of removedIds) {
      await execute(() => agentsApi.deleteAgentImage(agentId, fileId));
    }
    const finalIds = [...activeExisting.map((image) => image.fileId), ...newIds];
    const newIndex = newPhotos.findIndex((photo) => photo.preview === effectiveCoverKey);
    const coverId = newIndex >= 0 ? newIds[newIndex] : effectiveCoverKey;
    await execute(() => agentsApi.updateAgentImages(
      agentId,
      finalIds.map((fileId, order) => ({ fileId, order, isCover: fileId === coverId })),
    ));
  }

  async function save(e) {
    e.preventDefault();
    const localErrors = validateForm();
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    try {
      if (editing && editingAgent) {
        await execute(() => agentsApi.updateAgent(editing, payload()));
        if (photosDirty) await savePhotoDraft(editing, editingAgent);
      } else {
        await execute(() => agentsApi.createAgent(payload(), newPhotos.map((photo) => photo.file)));
      }
      clearNewPhotos();
      setForm(empty);
      setFieldErrors({});
      setEditing(null);
      await load();
    } catch (cause) {
      if (cause instanceof ApiError && cause.details.length > 0) {
        const nextErrors: Record<string, string> = {};
        cause.details.forEach(({ path, message }) => {
          const field = path.startsWith('pricing.amount')
            ? 'amount'
            : path.startsWith('pricing.currency')
              ? 'currency'
              : path.startsWith('badges')
                ? 'badges'
                : path;
          if (['name', 'phone', 'address', 'badges', 'bio', 'experienceYears', 'languages', 'amount', 'currency'].includes(field)) {
            nextErrors[field] ??= message;
          }
        });
        setFieldErrors(nextErrors);
      }
      return;
    }
  }

  async function remove(agent: Agent) {
    if (deletePending.current) return;
    deletePending.current = true;
    setDeletingAgentId(agent.id);
    try {
      await execute(() => agentsApi.deleteAgent(agent.id));
      if (editing === agent.id) {
        setEditing(null);
        clearNewPhotos();
        setForm(empty);
        setFieldErrors({});
      }
      await load();
    } catch {
      return;
    } finally {
      deletePending.current = false;
      setDeletingAgentId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 min-[720px]:grid-cols-2">
      <form ref={formRef} className={`card ${styles.formPanel}${editingAgent ? ` ${styles.editingForm}` : ''}`} onSubmit={save} noValidate>
        <h2>{editingAgent ? `Edit ${editingAgent.name}` : 'New agent'}</h2>
        <div className={`field${fieldErrors.name ? ' has-error' : ''}`}>
          <Input id="agent-name" label="Name" error={fieldErrors.name} value={form.name} onChange={(e) => updateField('name', e.target.value)} required maxLength={80} />
        </div>
        <div className={`field${fieldErrors.phone ? ' has-error' : ''}`}>
          <Input id="agent-phone" label="Phone" error={fieldErrors.phone} type="tel" inputMode="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required minLength={5} maxLength={20} />
        </div>
        <div className={`field${fieldErrors.address ? ' has-error' : ''}`}>
          <Input id="agent-address" label="Address" error={fieldErrors.address} value={form.address} onChange={(e) => updateField('address', e.target.value)} maxLength={300} />
        </div>
        <div className={`field${fieldErrors.badges ? ' has-error' : ''}`}>
          <Input id="agent-badges" label="Badges (comma separated)" error={fieldErrors.badges} value={form.badges} onChange={(e) => updateField('badges', e.target.value)} />
        </div>
        <div className={`field${fieldErrors.bio ? ' has-error' : ''}`}>
          <Textarea
            id="agent-bio"
            label="About / bio"
            rows={4}
            error={fieldErrors.bio}
            hint={`${form.bio.length}/${MAX_BIO_LENGTH} · shown to customers on the agent page`}
            value={form.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            maxLength={MAX_BIO_LENGTH + 50}
          />
        </div>
        <div className="row">
          <div className={`field${fieldErrors.experienceYears ? ' has-error' : ''}`} style={{ width: 150 }}>
            <Input id="agent-experience" label="Experience (years)" error={fieldErrors.experienceYears} type="number" min="0" max={MAX_EXPERIENCE_YEARS} step="1" value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} />
          </div>
          <div className={`field${fieldErrors.languages ? ' has-error' : ''}`} style={{ flex: 1 }}>
            <Input id="agent-languages" label="Languages (comma separated)" error={fieldErrors.languages} placeholder="English, Hindi" value={form.languages} onChange={(e) => updateField('languages', e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div className={`field${fieldErrors.amount ? ' has-error' : ''}`} style={{ flex: 1 }}>
            <Input
              id="agent-amount"
              label="Amount"
              error={fieldErrors.amount}
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => updateField('amount', Number(e.target.value))}
              required
            />
          </div>
          <div className={`field${fieldErrors.currency ? ' has-error' : ''}`} style={{ width: 100 }}>
            <Input id="agent-currency" label="Currency" error={fieldErrors.currency} value={form.currency} onChange={(e) => updateField('currency', e.target.value)} minLength={3} maxLength={6} />
          </div>
        </div>
        {editingAgent ? (
          <section className={styles.photoEditor} aria-labelledby="agent-photo-editor-heading">
            <div className={styles.photoEditorHeading}>
              <h3 id="agent-photo-editor-heading">Photos</h3>
              <span>{activeKeys.length}/{MAX_AGENT_IMAGES}</span>
            </div>
            {photosDirty && <p className={styles.draftNote}>Photo changes are applied when you click Save.</p>}
            {fieldErrors.photos && <p className="field-error" role="alert">{fieldErrors.photos}</p>}
            <div className="agent-edit-photo-grid">
              {existingPhotos.map((image) => {
                const removed = removedIds.includes(image.fileId);
                const isCover = !removed && effectiveCoverKey === image.fileId;
                return (
                  <div key={image.fileId} className={`${styles.editPhoto}${isCover ? ` ${styles.cover}` : ''}${removed ? ` ${styles.removed}` : ''}`}>
                    <div className={styles.editPhotoFrame}>
                      <img src={image.url} alt={`${editingAgent.name} photo`} />
                      {isCover && <span className={styles.coverBadge}><span aria-hidden="true">✓</span> Cover</span>}
                      {removed && <span className={styles.removedBadge}>Removed</span>}
                    </div>
                    <div className={styles.editPhotoActions}>
                      {removed ? (
                        <Button type="button" variant="secondary" className={styles.setCover} onClick={() => toggleRemoved(image.fileId)}>
                          Undo
                        </Button>
                      ) : (
                        <>
                          {!isCover && (
                            <Button type="button" variant="secondary" className={styles.setCover} onClick={() => setCoverKey(image.fileId)}>
                              Set as cover
                            </Button>
                          )}
                          <Button
                            type="button"
                            className={`${styles.photoRemove} ${styles.photoDeleteTrigger}`}
                            aria-label={`Remove photo from ${editingAgent.name}`}
                            disabled={activeKeys.length <= 1}
                            onClick={() => toggleRemoved(image.fileId)}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {newPhotos.map((photo, index) => {
                const isCover = effectiveCoverKey === photo.preview;
                return (
                  <div key={photo.preview} className={`${styles.editPhoto}${isCover ? ` ${styles.cover}` : ''}`}>
                    <div className={styles.editPhotoFrame}>
                      <img src={photo.preview} alt={`New photo ${photo.file.name}`} />
                      {isCover ? <span className={styles.coverBadge}><span aria-hidden="true">✓</span> Cover</span> : <span className={styles.newBadge}>New</span>}
                    </div>
                    <div className={styles.editPhotoActions}>
                      {!isCover && (
                        <Button type="button" variant="secondary" className={styles.setCover} onClick={() => setCoverKey(photo.preview)}>
                          Set as cover
                        </Button>
                      )}
                      <Button
                        type="button"
                        className={`${styles.photoRemove} ${styles.photoDeleteTrigger}`}
                        aria-label={`Remove ${photo.file.name}`}
                        disabled={activeKeys.length <= 1}
                        onClick={() => removeNewPhoto(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <label className={`button ${styles.photoPicker}`}>
              Add photos
              <Input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={activeKeys.length >= MAX_AGENT_IMAGES} onChange={(event) => { addPhotos(event.target.files); event.target.value = ''; }} />
            </label>
          </section>
        ) : (
          <div className={`field${fieldErrors.photos ? ' has-error' : ''}`}>
            <label htmlFor="new-agent-photos">Photos <span className={styles.photoRequired}>Required · at least 1</span></label>
            <label className={`button ${styles.photoPicker}`}>
              Choose photos
              <Input id="new-agent-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => { selectNewPhotos(event.target.files); event.target.value = ''; }} aria-invalid={Boolean(fieldErrors.photos)} aria-describedby={fieldErrors.photos ? 'new-agent-photos-error' : undefined} />
            </label>
            <p className={`meta ${styles.photoHint}`}>JPEG, PNG or WebP · up to {MAX_AGENT_IMAGES} photos · 5 MB each</p>
            {fieldErrors.photos && <p className="field-error" id="new-agent-photos-error">{fieldErrors.photos}</p>}
            {newPhotos.length > 0 && (
              <div className={styles.newPhotoGrid}>
                {newPhotos.map((photo, index) => (
                  <div key={`${photo.file.name}-${photo.file.lastModified}`} className={styles.newPhotoPreview}>
                    <img src={photo.preview} alt={`Selected ${photo.file.name}`} />
                    <span title={photo.file.name}>{photo.file.name}</span>
                    <Button type="button" variant="linkish" aria-label={`Remove ${photo.file.name}`} onClick={() => removeNewPhoto(index)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={styles.formActions}>
          <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
          {editing && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(null);
                clearNewPhotos();
                setForm(empty);
                setFieldErrors({});
                clearError();
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
      <div>
        {loading ? <LoadingState label="Loading agents..." /> : agents.length === 0 ? (
          <EmptyState message="No agents found." />
        ) : agents.map((agent) => (
          <div key={agent.id} className={`card mb-3 ${styles.adminCard}${editing === agent.id ? ` ${styles.editing}` : ''}`}>
            <div className={styles.adminCardTop}>
              {agent.coverUrl ? (
                <img className={styles.adminCover} src={agent.coverUrl} alt={`${agent.name} cover`} />
              ) : (
                <div className={`${styles.adminCover} ${styles.noCover}`} aria-hidden="true" />
              )}
              <div className={styles.adminDetails}>
                <div className={styles.adminCardHeading}>
                  <h3>{agent.name}</h3>
                  {editing === agent.id && <span className={styles.editingIndicator}>● Editing</span>}
                </div>
                <span className={styles.agentId} title="Agent ID">ID · {agent.id}</span>
                <AgentBadges badges={agent.badges} />
                <p className="meta">
                  {agent.phone} · {agent.pricing.currency} {agent.pricing.amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className={styles.thumbRow}>
              {[...agent.images].sort((a, b) => a.order - b.order).slice(0, 6).map((image) => (
                <img key={image.fileId} src={image.url} alt="" loading="lazy" className={image.isCover ? styles.thumbCover : undefined} />
              ))}
              <span className={styles.thumbCount}>{agent.images.length}/{MAX_AGENT_IMAGES} photos</span>
            </div>
            <div className={`row ${styles.adminActions}`}>
              <Button
                type="button"
                className={`${styles.selectTrigger}${editing === agent.id ? ` ${styles.selected}` : ''}`}
                aria-pressed={editing === agent.id}
                onClick={() => {
                  // On phones the form sits above the list, so bring it into view; on desktop it is pinned.
                  if (window.matchMedia('(max-width: 719px)').matches) {
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                  setEditing(agent.id);
                  clearNewPhotos();
                  setFieldErrors({});
                  clearError();
                  setForm({
                    name: agent.name,
                    phone: agent.phone,
                    address: agent.address,
                    badges: agent.badges.join(', '),
                    bio: agent.bio ?? '',
                    experienceYears: agent.experienceYears === undefined ? '' : String(agent.experienceYears),
                    languages: (agent.languages ?? []).join(', '),
                    amount: agent.pricing.amount,
                    currency: agent.pricing.currency,
                  });
                }}
              >
                {editing === agent.id ? '✓ Selected' : 'Select'}
              </Button>
              <MoreMenu
                label={`Delete ${agent.name}`}
                subject={agent.name}
                confirmation="They will no longer appear to customers."
                onConfirm={() => { void remove(agent); }}
                disabled={deletingAgentId !== null}
                buttonText={deletingAgentId === agent.id ? 'Deleting…' : 'Delete'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
