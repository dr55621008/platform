# Asset Storage Architecture

**Version:** 1.0  
**Last Updated:** 2026-03-28

---

## S3 Bucket Structure

```
s3://brokerhub-assets/
├── brand/                      # Platform brand assets
│   ├── logo-full.svg
│   ├── logo-full.png           # Transparent background
│   ├── logo-icon.svg
│   ├── logo-icon.png
│   ├── logo-vertical.svg
│   ├── logo-app-icon.png       # 1024x1024
│   └── brand-tokens.json
│
├── tenants/                    # Per-tenant white-label assets
│   ├── {tenant_id}/
│   │   ├── custom-logo.png
│   │   ├── custom-logo.svg
│   │   ├── favicon.ico
│   │   └── brand-overrides.json
│   │
│   └── broker_acme_001/
│       └── ...
│
├── documents/                  # Tenant documents (uploaded by users)
│   ├── {tenant_id}/
│   │   ├── {conversation_id}/
│   │   │   └── document.pdf
│   │   └── ...
│   └── ...
│
└── exports/                    # Generated reports/exports
    ├── {tenant_id}/
    │   └── report_2026-03-28.pdf
    └── ...
```

---

## Access Control

### Brand Assets (Public Read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadBrandAssets",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::brokerhub-assets/brand/*"
    }
  ]
}
```

### Tenant Assets (Authenticated)
- Signed URLs with tenant_id in policy
- 1-hour expiry for document access
- CloudFront distribution for CDN

### Documents (Private)
- Server-side encryption (SSE-S3)
- Access via API only (presigned URLs)
- Audit logging on all access

---

## Asset Upload Flow

### Platform Brand Assets
```
1. Admin uploads via admin dashboard
2. Assets stored in s3://brokerhub-assets/brand/
3. CloudFront cache invalidated
4. Available globally via CDN
```

### Tenant White-Label Assets
```
1. Tenant admin uploads logo via settings
2. API validates file (size, format, dimensions)
3. Stored in s3://brokerhub-assets/tenants/{tenant_id}/
4. brand_config.updated_at set in DB
5. Cache invalidated for tenant
```

### User Documents
```
1. User uploads via conversation
2. API generates presigned PUT URL
3. Client uploads directly to S3
4. Document record created in tenant schema
5. Processing triggered (if applicable)
```

---

## File Format Requirements

### Logos

| Format | Max Size | Min Dimensions | Use Case |
|--------|----------|----------------|----------|
| SVG | 100KB | N/A (vector) | Primary logo (scalable) |
| PNG | 500KB | 512x512 | Fallback, app icons |
| ICO | 64KB | 16x16 to 256x256 | Favicon |

### Documents

| Format | Max Size | Processing Support |
|--------|----------|-------------------|
| PDF | 50MB | Full (text + images) |
| DOCX | 20MB | Full (text extraction) |
| TXT | 10MB | Full |
| PNG/JPG | 10MB | OCR + image analysis |

---

## CDN Configuration (CloudFront)

### Distribution Settings
- **Origin:** S3 bucket (brokerhub-assets)
- **Cache Policy:** CachingOptimized
- **Compression:** Gzip + Brotli
- **HTTPS:** Required (TLS 1.3)

### Cache Behaviors

| Path Pattern | TTL | Forward Headers |
|--------------|-----|-----------------|
| /brand/* | 1 day | None |
| /tenants/*/custom-logo.* | 1 hour | Authorization |
| /documents/* | 0 (bypass) | Authorization (signed URL) |

---

## Cost Optimization

### Lifecycle Policies

```json
{
  "Rules": [
    {
      "ID": "ExportCleanup",
      "Status": "Enabled",
      "Prefix": "exports/",
      "Expiration": { "Days": 30 },
      "Transitions": [
        {
          "Days": 7,
          "StorageClass": "STANDARD_IA"
        }
      ]
    },
    {
      "ID": "DocumentArchive",
      "Status": "Enabled",
      "Prefix": "documents/",
      "Transitions": [
        { "Days": 90, "StorageClass": "GLACIER" }
      ]
    }
  ]
}
```

### Estimated Costs (Monthly)

| Storage Class | Volume | Cost/GB | Monthly |
|---------------|--------|---------|---------|
| STANDARD | 100GB | $0.023 | $2.30 |
| STANDARD_IA | 50GB | $0.0125 | $0.63 |
| GLACIER | 200GB | $0.004 | $0.80 |
| **Total** | **350GB** | - | **~$4/month** |

---

## Security

### Encryption
- **At Rest:** SSE-S3 (AES-256)
- **In Transit:** TLS 1.3
- **Presigned URLs:** SHA-256 signatures

### Access Logging
- S3 server access logging enabled
- Logs stored in separate bucket
- Retained for 7 years (compliance)

### CORS Configuration
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["Authorization", "Content-Type"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedOrigins": ["https://*.brokerhub.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

---

## Monitoring

### CloudWatch Alarms
- **4xx Error Rate > 1%** → Notify
- **5xx Error Rate > 0.1%** → Page
- **Bandwidth Spike > 200%** → Investigate

### Metrics to Track
- Total objects
- Storage size by prefix
- Request count by operation
- Bandwidth transferred
- Cache hit ratio

---

## Backup & Recovery

### Versioning
- Enabled on all buckets
- Retain last 10 versions
- MFA delete enabled

### Cross-Region Replication
- Primary: ap-east-1 (Hong Kong)
- Replica: ap-southeast-1 (Singapore)
- RPO: < 1 hour
- RTO: < 4 hours

---

**Contact:** infrastructure@brokerhub.com for access requests or issues.
