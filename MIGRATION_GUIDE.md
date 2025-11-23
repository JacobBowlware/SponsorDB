# Sponsor Data Model Restructure - Migration Guide

## Overview

This document describes the major restructure of the sponsor data model to support multiple newsletter placements per sponsor. The changes are **non-destructive** - your existing data remains intact, and a migration API route has been created to safely convert your data.

## What Changed

### New Collections Created

1. **SponsorNew** - New sponsor model with `newslettersSponsored` array instead of single `newsletterSponsored` field
2. **Affiliate** - Separate collection for affiliate programs with `affiliatedNewsletters` array

**Note:** Newsletter metadata is stored directly in the `newslettersSponsored` array within each sponsor - no separate newsletter collection needed.

### Key Changes

- **Sponsors**: Now support multiple newsletter placements via `newslettersSponsored` array
- **Scraper Logic**: Automatically consolidates sponsors by `rootDomain` - if a sponsor already exists, new newsletter info is appended instead of creating duplicates
- **Contact Info**: Moving away from `sponsorApplication` - now only storing `sponsorEmail` addresses
- **Affiliates**: Separated into their own collection with similar structure

## Migration Process

### Step 1: Run the Migration API

The migration route is available at `/api/migration/migrate` (requires admin auth).

**To run the migration:**

1. Make sure you're logged in as an admin
2. Make a POST request to: `POST /api/migration/migrate`
3. The migration will:
   - Read all existing sponsors from the `sponsors` collection
- Consolidate sponsors by `rootDomain`
- Convert newsletter data to the new `newslettersSponsored` array format
- Create new sponsors in `SponsorNew` collection
- Separate affiliate programs into `Affiliate` collection
- **Preserve all existing data** - nothing is deleted

**Preview migration status:**
- `GET /api/migration/migrate/preview` - Shows counts of existing vs new data (sponsors and affiliates)

### Step 2: Verify Migration

After migration, check:
- New sponsors appear in `SponsorNew` collection
- Newsletter data is properly structured in `newslettersSponsored` arrays
- Affiliate programs are in `Affiliate` collection
- All contact information is preserved

### Step 3: Update Frontend (Already Done)

The frontend has been updated to:
- Display a "Placements" column showing newsletter count
- Expand to show full list of newsletters with audience sizes and tags
- Maintain backward compatibility with old data format

## New Data Structure

### SponsorNew Schema

```javascript
{
  sponsorName: String,
  sponsorLink: String,
  rootDomain: String (indexed),
  tags: [String],
  newslettersSponsored: [{
    newsletterName: String,
    estimatedAudience: Number,
    contentTags: [String],
    dateSponsored: Date,
    emailAddress: String
  }],
  sponsorEmail: String,
  businessContact: String,
  contactMethod: 'email' | 'none',
  status: 'pending' | 'approved',
  // ... user tracking fields
}
```

### Affiliate Schema

```javascript
{
  affiliateName: String,
  affiliateLink: String,
  rootDomain: String (indexed),
  tags: [String],
  affiliatedNewsletters: [{
    newsletterName: String,
    estimatedAudience: Number,
    contentTags: [String],
    dateAffiliated: Date,
    emailAddress: String
  }],
  commissionInfo: String,
  status: 'pending' | 'approved',
  interestedUsers: [ObjectId]
}
```

## Updated Routes

### Sponsors Route (`/api/sponsors`)

- **GET /** - Now uses `SponsorNew` collection, falls back to old `Sponsor` if needed
- **POST /** - Creates/updates sponsors in new structure, consolidates by `rootDomain`
- **GET /db-info** - Updated to count from new collections

### Migration Route (`/api/migration`)

- **POST /migrate** - Runs the migration (admin only)
- **GET /migrate/preview** - Preview migration status (admin only)

## Scraper Updates

The Python scraper (`server/newsletter_scraper/`) has been updated to:
- Check for existing sponsors by `rootDomain`
- Append newsletter info to `newslettersSponsored` array instead of creating duplicates
- Use the new `SponsorNew` collection (`sponsornews` in MongoDB)

## Frontend Updates

### PaidSponsorTable Component

- Added "Placements" column
- Shows collapsed count (e.g., "3 newsletters")
- Expands to show full list with audience sizes and content tags
- Maintains backward compatibility with old `newsletterSponsored` field

### CSS Styling

- Added styles for placements cell, toggle button, and expanded list
- Tag badges for content tags
- Responsive design maintained

## Backward Compatibility

The system maintains full backward compatibility:
- Old `Sponsor` collection data still works
- Routes fall back to old structure if new collections don't exist
- Frontend handles both old and new data formats
- Migration is optional - you can run it when ready

## Important Notes

1. **No Data Loss**: The migration is non-destructive. Your existing `sponsors` collection remains untouched.

2. **Gradual Migration**: You can migrate gradually - the system works with both old and new structures simultaneously.

3. **Testing**: Test the migration on a development/staging environment first.

4. **Rollback**: If needed, you can continue using the old structure - just don't run the migration.

5. **Scraper**: The scraper now writes to the new `SponsorNew` collection by default. Make sure to run migration before using the scraper for best results.

## Next Steps

1. Review the migration code in `server/routes/migration.js`
2. Test the migration endpoint in a development environment
3. Run the migration on production when ready
4. Monitor the new collections to ensure data integrity
5. Gradually phase out old `Sponsor` collection usage (optional)

## Questions?

If you encounter any issues:
1. Check the migration preview endpoint first
2. Review server logs for detailed migration progress
3. The migration provides detailed error reporting for any issues

