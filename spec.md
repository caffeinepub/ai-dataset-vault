# AI Dataset Vault

## Current State
New project. No existing backend or frontend code.

## Requested Changes (Diff)

### Add
- Full dataset upload system with CSV validation and quality scoring
- SHA-256 hashing of dataset content for integrity verification
- On-chain metadata storage using ICP (acts as the blockchain layer)
- Training access control — only VERIFIED datasets can trigger training
- Integrity re-check before training (hash comparison)
- Simulated AI training endpoint returning mock metrics (accuracy, precision, recall)
- External training link management (admin can set a URL, e.g. HuggingFace)
- Temporary secure access token for external training redirects
- Audit log recording all key events
- React frontend: Upload page, Training page, Admin/External Training page

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)

**Data Models:**
- `Dataset`: id, name, ownerId, fileContent (Text), qualityPercentage (Float), hash (Text), status (verified | rejected | compromised), createdAt, externalTrainingUrl (optional)
- `AuditLog`: id, event (Text), datasetId (optional), timestamp, details (Text)
- `ExternalTrainingLink`: url (Text), datasetId

**Core Functions:**
- `uploadDataset(name, csvContent)` → parse CSV, validate rows (no missing/null/duplicate), compute quality %, reject if < 60%, compute SHA-256 hash, store on-chain, log event, return result
- `getDatasets()` → list all datasets with metadata
- `getDataset(id)` → get single dataset
- `trainModel(datasetId)` → verify exists + VERIFIED, recompute hash, compare with stored hash, if mismatch mark COMPROMISED and block, else simulate training and return metrics
- `setExternalTrainingUrl(url)` → admin stores external training website URL
- `getExternalTrainingLink(datasetId)` → only for VERIFIED datasets, return secure token + external URL
- `getAuditLogs()` → return all audit events

**Audit Events:**
- dataset_uploaded, dataset_rejected, dataset_verified, tamper_detected, training_started

### Frontend (React)

**Pages / Sections:**
1. **Upload Page** — drag-and-drop or file input for CSV, shows quality %, verification badge, blockchain confirmation badge after upload
2. **Datasets List** — table of all datasets with status badges (verified/rejected/compromised)
3. **Training Page** — select dataset, Train button enabled only for VERIFIED datasets, displays accuracy/precision/recall after training
4. **Admin Page** — input field to set external training URL, list of verified datasets with "Open External Training" button that generates a secure token link
5. **Audit Log Page** — chronological list of all audit events
