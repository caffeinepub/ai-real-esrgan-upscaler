# AI Real-ESRGAN Upscaler Service

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Image upload page with drag-and-drop support
- Enhancement type selector: Real-ESRGAN (2x/4x/8x), SwinIR super-resolution, LaMa inpainting (restoration), DeOldify colorization, Stable Diffusion inpainting (object removal)
- Before/after image comparison slider
- Progress indicator during processing
- Download button for enhanced images
- Image history gallery (per user session)
- Batch image processing support (queue multiple images)
- User authentication (to associate history with accounts)
- Backend job tracking: submit job -> poll status -> retrieve result
- HTTP outcall integration to external AI processing endpoints
- Blob storage for uploaded originals and processed results

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Select: authorization, blob-storage, http-outcalls
2. Backend (Motoko):
   - Enhancement job record: id, userId, originalImageId, resultImageId, enhancementType, scale, status (pending/processing/done/failed), createdAt
   - submitJob(imageId, enhancementType, scale) -> jobId
   - getJob(jobId) -> JobRecord
   - listUserJobs() -> [JobRecord]
   - deleteJob(jobId)
   - HTTP outcall to external AI API with image bytes, returns processed image bytes
   - Store result in blob storage
3. Frontend (React):
   - Dashboard layout with sidebar nav
   - Upload panel: drag-and-drop zone + file picker, multi-file batch support
   - Enhancement options panel: type selector, scale selector
   - Processing queue with per-item progress
   - Before/after comparison slider component
   - History gallery grid
   - Download button per result
