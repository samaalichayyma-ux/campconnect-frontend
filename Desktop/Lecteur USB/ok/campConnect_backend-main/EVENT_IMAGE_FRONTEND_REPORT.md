# Event Image Upload Report

## What changed

- Event images now have one real source of truth: `EventImage`.
- Uploading a new image no longer silently replaces the current gallery or primary image unless `makePrimary=true`.
- Deleting an image now re-syncs the event image fields.
- Creating an event with images now uses the authenticated user instead of a custom `userId` header.
- Event responses now expose:
  - `primaryImageUrl`
  - `galleryImageUrls`
  - `imageCount`
  - `images` (ordered metadata list)
- `bannerImage`, `thumbnailImage`, and `galleryImages` are still returned for backward compatibility.

## Frontend source of truth

Use these fields first:

- `primaryImageUrl`: main event image to display
- `galleryImageUrls`: ordered array of displayable image URLs
- `images`: ordered list with metadata for edit screens

Backward-compatible fields:

- `bannerImage`: mirrors the current primary image URL
- `thumbnailImage`: mirrors the current primary image URL
- `galleryImages`: JSON string version of `galleryImageUrls`

## Endpoints

### 1. Create event without images

- `POST /api/events/createEvent`
- `Content-Type: application/json`
- Auth required

### 2. Create event with images

- `POST /api/events/createEventWithImages`
- Also available on legacy path: `POST /api/events/addImages`
- `Content-Type: multipart/form-data`
- Auth required

Multipart parts:

- `event`: JSON blob matching `EventRequestDTO`
- `images`: repeat this part for each selected file

Do not send `userId` header anymore.

Example:

```js
const formData = new FormData();
formData.append(
  "event",
  new Blob([JSON.stringify(eventPayload)], { type: "application/json" })
);

files.forEach((file) => {
  formData.append("images", file);
});
```

### 3. Add one image to an existing event

- `POST /api/events/{eventId}/addImage`
- `Content-Type: multipart/form-data`
- Auth required

Fields:

- `image`: single file
- `makePrimary`: optional boolean, default `false`

Behavior:

- if the event has no images yet, the uploaded image becomes primary
- if the event already has images, the uploaded image stays non-primary unless `makePrimary=true`

### 4. Add multiple images to an existing event

- `POST /api/events/{eventId}/images`
- `Content-Type: multipart/form-data`
- Auth required

Fields:

- `images`: repeat per file
- `makePrimary`: optional boolean, default `false`

Behavior:

- with `makePrimary=false`, existing primary stays primary
- with `makePrimary=true`, the first uploaded file becomes the new primary image

Example:

```js
const formData = new FormData();

files.forEach((file) => {
  formData.append("images", file);
});

formData.append("makePrimary", "false");
```

### 5. List event images

- `GET /api/events/{eventId}/images`

Returns ordered `EventImageDTO[]`.

### 6. Get image content

- `GET /api/events/images/{imageId}/content`

This is the URL already returned in:

- `primaryImageUrl`
- `galleryImageUrls`
- `images[].imageUrl`

### 7. Set primary image

- `PUT /api/events/{eventId}/images/{imageId}/setAsPrimary`

Returns the updated `EventResponseDTO`.

### 8. Delete image

- `DELETE /api/events/{eventId}/images/{imageId}`

Returns `200 OK`.

After delete, refetch either:

- `GET /api/events/getEvent/{eventId}`, or
- `GET /api/events/{eventId}/images`

## Response shape to use in UI

Example important fields:

```json
{
  "id": 12,
  "primaryImageUrl": "/api/events/images/33/content",
  "galleryImageUrls": [
    "/api/events/images/33/content",
    "/api/events/images/34/content"
  ],
  "imageCount": 2,
  "images": [
    {
      "id": 33,
      "imageName": "cover.png",
      "imageUrl": "/api/events/images/33/content",
      "isPrimary": true,
      "displayOrder": 0
    },
    {
      "id": 34,
      "imageName": "gallery-1.png",
      "imageUrl": "/api/events/images/34/content",
      "isPrimary": false,
      "displayOrder": 1
    }
  ]
}
```

## File limits

- Max single file size: `10MB`
- Max multipart request size: `30MB`
- Allowed extensions: `jpg`, `jpeg`, `png`, `gif`, `webp`

## Frontend action items

1. Stop sending `userId` header for event image creation.
2. Prefer `primaryImageUrl` and `galleryImageUrls` over parsing `galleryImages`.
3. Use `POST /api/events/{eventId}/images` for gallery uploads.
4. Only set `makePrimary=true` when the user explicitly chooses a new cover image.
5. After delete, refetch the event or image list.
