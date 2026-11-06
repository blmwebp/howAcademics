import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { Link } from 'react-router-dom';

import { api } from '../lib/api';
import { uploadImage, type Media } from './MediaPage';

/* =========================================================
   TYPES
========================================================= */

interface Banner {
  id: string;

  imageMediaId: string;
  mobileImageMediaId: string | null;

  image?: Media | null;
  mobileImage?: Media | null;

  headline: string | null;
  caption: string | null;

  targetType: string;
  targetIdOrUrl: string;

  sortOrder: number;
  isEnabled: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [media, setMedia] = useState<Media[]>([]);

  const [editing, setEditing] = useState<string | null>(
    null
  );

  /* ---------------- IMAGE FIELDS ---------------- */

  const [imageMediaId, setImageMediaId] = useState('');

  const [
    mobileImageMediaId,
    setMobileImageMediaId,
  ] = useState('');

  const [
    uploadingDesktop,
    setUploadingDesktop,
  ] = useState(false);

  const [
    uploadingMobile,
    setUploadingMobile,
  ] = useState(false);

  /* ---------------- BANNER FIELDS ---------------- */

  const [headline, setHeadline] = useState('');

  const [caption, setCaption] = useState('');

  const [targetIdOrUrl, setTargetIdOrUrl] =
    useState('/books');

  const [sortOrder, setSortOrder] = useState(0);

  const [isEnabled, setIsEnabled] = useState(true);

  /* ---------------- UI STATE ---------------- */

  const [error, setError] = useState('');

  const [message, setMessage] = useState('');

  const [saving, setSaving] = useState(false);

  /* =========================================================
     LOAD BANNERS AND MEDIA
  ========================================================= */

  const reload = useCallback(async () => {
    try {
      const [bannerItems, mediaItems] = await Promise.all([
        api<Banner[]>('/banners'),
        api<Media[]>('/media'),
      ]);

      setBanners(bannerItems);
      setMedia(mediaItems);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load banners'
      );
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /* =========================================================
     SELECTED MEDIA
  ========================================================= */

  const desktopMedia = media.find(
    (item) => item.id === imageMediaId
  );

  const mobileMedia = media.find(
    (item) => item.id === mobileImageMediaId
  );

  const desktopPreview =
    desktopMedia?.url ||
    banners.find((item) => item.id === editing)
      ?.image?.url;

  const mobilePreview =
    mobileMedia?.url ||
    banners.find((item) => item.id === editing)
      ?.mobileImage?.url;

  /* =========================================================
     CLEAR FORM
  ========================================================= */

  const clear = () => {
    setEditing(null);

    setImageMediaId('');
    setMobileImageMediaId('');

    setHeadline('');
    setCaption('');

    setTargetIdOrUrl('/books');

    setSortOrder(banners.length);
    setIsEnabled(true);

    setError('');
  };

  /* =========================================================
     EDIT EXISTING BANNER
  ========================================================= */

  const edit = (banner: Banner) => {
    setEditing(banner.id);

    setImageMediaId(banner.imageMediaId);

    setMobileImageMediaId(
      banner.mobileImageMediaId || ''
    );

    setHeadline(banner.headline || '');
    setCaption(banner.caption || '');

    setTargetIdOrUrl(
      banner.targetIdOrUrl || '/books'
    );

    setSortOrder(banner.sortOrder);
    setIsEnabled(banner.isEnabled);

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const addImage = async (
    file: File | undefined,
    type: 'desktop' | 'mobile'
  ) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const setUploading =
      type === 'desktop'
        ? setUploadingDesktop
        : setUploadingMobile;

    setUploading(true);

    setError('');
    setMessage('');

    try {
      const item = await uploadImage(
        file,
        'banner',
        headline || `HowAcademics ${type} banner`
      );

      // Keep the uploaded media available immediately.
      setMedia((current) => {
        const withoutDuplicate = current.filter(
          (mediaItem) => mediaItem.id !== item.id
        );

        return [item, ...withoutDuplicate];
      });

      if (type === 'desktop') {
        setImageMediaId(item.id);
      } else {
        setMobileImageMediaId(item.id);
      }

      setMessage(
        `${type === 'desktop' ? 'Desktop' : 'Mobile'} image uploaded successfully.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Image upload failed'
      );
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     SAVE BANNER
  ========================================================= */

  const save = async (event: FormEvent) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!imageMediaId) {
      setError('Please select a desktop banner image.');
      return;
    }

    if (!mobileImageMediaId) {
      setError('Please select a mobile banner image.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        imageMediaId,
        mobileImageMediaId,

        headline,
        caption,

        targetType: 'url',
        targetIdOrUrl,

        sortOrder,
        isEnabled,
      };

      await api(
        '/banners' + (editing ? `/${editing}` : ''),
        editing ? 'PUT' : 'POST',
        payload
      );

      setMessage(
        editing
          ? 'Banner updated successfully.'
          : 'Banner created successfully.'
      );

      clear();

      await reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save banner'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE BANNER
  ========================================================= */

  const deleteBanner = async (banner: Banner) => {
    const confirmed = window.confirm(
      `Delete "${banner.headline || 'Untitled banner'}"?`
    );

    if (!confirmed) return;

    setError('');

    try {
      await api(
        `/banners/${banner.id}`,
        'DELETE'
      );

      setMessage('Banner deleted successfully.');

      if (editing === banner.id) {
        clear();
      }

      await reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to delete banner'
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="max-w-6xl">
      {/* PAGE HEADING */}

      <div className="mb-7">
        <h1 className="text-3xl font-bold mb-2">
          Banner management
        </h1>

        <p className="text-slate-500">
          Manage desktop and mobile banner images,
          headlines, destinations and display order.
          The public carousel changes banners every
          three seconds.
        </p>
      </div>

      {/* MESSAGES */}

      {error && (
        <p role="alert" className="admin-error mb-4">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="admin-success mb-4">
          {message}
        </p>
      )}

      {/* =====================================
          CREATE / EDIT FORM
      ===================================== */}

      <form
        onSubmit={save}
        className="admin-panel space-y-7 mb-8"
      >
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {editing ? 'Edit banner' : 'Create banner'}
          </h2>

          <p className="text-sm text-slate-500">
            Upload separate images for desktop and mobile.
            Both images share the same headline and destination.
          </p>
        </div>

        {/* =====================================
            TWO IMAGE UPLOADS
        ===================================== */}

        <div className="grid md:grid-cols-2 gap-6">
          {/* DESKTOP IMAGE */}

          <div className="border rounded-lg p-5 bg-white">
            <div className="mb-4">
              <h3 className="font-semibold text-lg">
                Desktop banner
              </h3>

              <p className="text-sm text-slate-500">
                Recommended: 1920 × 800 px
              </p>
            </div>

            {/* PREVIEW */}

            <div className="aspect-[12/5] bg-slate-100 rounded overflow-hidden mb-4">
              {desktopPreview ? (
                <img
                  src={desktopPreview}
                  alt="Desktop banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No desktop image selected
                </div>
              )}
            </div>

            {/* EXISTING MEDIA */}

            <label className="block text-sm font-medium">
              Select existing image

              <select
                required
                className="admin-input mt-2"
                value={imageMediaId}
                onChange={(event) =>
                  setImageMediaId(event.target.value)
                }
              >
                <option value="">
                  Select desktop image
                </option>

                {media.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.altText ||
                      item.originalFilename ||
                      item.id}
                  </option>
                ))}
              </select>
            </label>

            {/* UPLOAD */}

            <label className="block text-sm font-medium mt-5">
              Or upload new image

              <input
                className="admin-input mt-2"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingDesktop}
                onChange={(event) => {
                  void addImage(
                    event.target.files?.[0],
                    'desktop'
                  );

                  event.target.value = '';
                }}
              />
            </label>

            {uploadingDesktop && (
              <p className="text-sm text-blue-600 mt-3">
                Uploading desktop image...
              </p>
            )}
          </div>

          {/* MOBILE IMAGE */}

          <div className="border rounded-lg p-5 bg-white">
            <div className="mb-4">
              <h3 className="font-semibold text-lg">
                Mobile banner
              </h3>

              <p className="text-sm text-slate-500">
                Recommended: 750 × 1000 px
              </p>
            </div>

            {/* PREVIEW */}

            <div className="aspect-[3/4] max-w-[230px] bg-slate-100 rounded overflow-hidden mb-4">
              {mobilePreview ? (
                <img
                  src={mobilePreview}
                  alt="Mobile banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No mobile image selected
                </div>
              )}
            </div>

            {/* EXISTING MEDIA */}

            <label className="block text-sm font-medium">
              Select existing image

              <select
                required
                className="admin-input mt-2"
                value={mobileImageMediaId}
                onChange={(event) =>
                  setMobileImageMediaId(event.target.value)
                }
              >
                <option value="">
                  Select mobile image
                </option>

                {media.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.altText ||
                      item.originalFilename ||
                      item.id}
                  </option>
                ))}
              </select>
            </label>

            {/* UPLOAD */}

            <label className="block text-sm font-medium mt-5">
              Or upload new image

              <input
                className="admin-input mt-2"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingMobile}
                onChange={(event) => {
                  void addImage(
                    event.target.files?.[0],
                    'mobile'
                  );

                  event.target.value = '';
                }}
              />
            </label>

            {uploadingMobile && (
              <p className="text-sm text-blue-600 mt-3">
                Uploading mobile image...
              </p>
            )}
          </div>
        </div>

        {/* =====================================
            CONTENT FIELDS
        ===================================== */}

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            Heading

            <input
              className="admin-input mt-1"
              value={headline}
              onChange={(event) =>
                setHeadline(event.target.value)
              }
            />
          </label>

          <label className="block">
            Destination path

            <input
              className="admin-input mt-1"
              value={targetIdOrUrl}
              onChange={(event) =>
                setTargetIdOrUrl(event.target.value)
              }
              placeholder="/books"
              required
            />
          </label>

          <label className="md:col-span-2 block">
            Supporting text

            <textarea
              className="admin-input mt-1"
              rows={3}
              value={caption}
              onChange={(event) =>
                setCaption(event.target.value)
              }
            />
          </label>

          <label className="block">
            Display order

            <input
              className="admin-input mt-1"
              type="number"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(Number(event.target.value))
              }
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) =>
                setIsEnabled(event.target.checked)
              }
            />

            Visible on public website
          </label>
        </div>

        {/* =====================================
            ACTIONS
        ===================================== */}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={
              saving ||
              uploadingDesktop ||
              uploadingMobile
            }
            className="admin-button disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : editing
                ? 'Update banner'
                : 'Create banner'}
          </button>

          {editing && (
            <button
              type="button"
              className="admin-button-secondary"
              onClick={clear}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* =====================================
          SAVED BANNERS
      ===================================== */}

      <div className="admin-panel">
        <h2 className="text-xl font-semibold mb-5">
          Saved banners ({banners.length})
        </h2>

        {!banners.length && (
          <p className="text-slate-500">
            No database banners yet.{' '}

            <Link
              className="text-blue-700 underline"
              to="/media"
            >
              Open media library
            </Link>
          </p>
        )}

        <ul className="divide-y">
          {banners.map((banner) => (
            <li
              key={banner.id}
              className="py-5"
            >
              <div className="flex flex-col lg:flex-row gap-5">
                {/* PREVIEWS */}

                <div className="flex gap-3 items-start">
                  {/* DESKTOP THUMBNAIL */}

                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Desktop
                    </p>

                    <div className="w-36 h-20 bg-slate-100 rounded overflow-hidden">
                      {banner.image?.url ? (
                        <img
                          src={banner.image.url}
                          alt="Desktop banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MOBILE THUMBNAIL */}

                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Mobile
                    </p>

                    <div className="w-16 h-20 bg-slate-100 rounded overflow-hidden">
                      {banner.mobileImage?.url ? (
                        <img
                          src={banner.mobileImage.url}
                          alt="Mobile banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          Not configured
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DETAILS */}

                <div className="flex-1">
                  <p className="font-semibold">
                    {banner.headline || 'Untitled banner'}
                  </p>

                  <p className="text-xs text-slate-500 mt-2">
                    {banner.isEnabled
                      ? 'Enabled'
                      : 'Hidden'}

                    {' · '}

                    Order {banner.sortOrder}
                  </p>

                  <p className="text-xs text-slate-500 mt-1 break-all">
                    {banner.targetIdOrUrl}
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="flex gap-4 items-start">
                  <button
                    type="button"
                    className="text-blue-700 underline text-sm"
                    onClick={() => edit(banner)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="text-red-700 underline text-sm"
                    onClick={() => {
                      void deleteBanner(banner);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}