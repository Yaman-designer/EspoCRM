import { Sparkles, FileText, Lock, Camera, Paperclip } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema } from '@/framework/form-engine'
import { CBANNER_TRUE } from '@/features/properties/domain/visibility'
import { getWebAssetUrl } from '@/lib/image-url'

// ── Step 7: Marketing & Media ────────────────────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 6. 11 fields: the 4
// marketing badges native to financial.schema.ts's Listing Quality section
// (fully drains it, alongside pricing-terms.schema.ts taking its Pricing
// section — financial.schema.ts needs no holding step), description/
// cDescriptionGr/cOfficeNotes/cPropertyEvaluatorAI/cBanner arriving from
// identity.schema.ts (fully drains identity-legacy — no holding step remains
// anywhere after this phase), and cBannerphoto/imagesIds native to
// media.schema.ts (fully drains it too).
//
// Implementation note / documented deviation: the source spec places
// cOfficeNotes/cPropertyEvaluatorAI in a collapsed "Internal Only" subgroup
// *nested inside* the open Listing Copy section. The form-engine's
// SectionRenderer only supports `collapsible` at the top-level section
// scope (confirmed in Phase 1 — no nested-collapsible-within-a-section
// primitive exists). Building that primitive would be new framework
// architecture, out of scope for a content migration phase. "Internal Only"
// is implemented here as its own top-level collapsible section instead —
// functionally equivalent (still directly after Listing Copy, still
// collapsed by default, still visually separated from public-facing copy,
// still resolves the Audit's 4-way text-field confusion finding), just a
// sibling section rather than a nested one.

const S = 'wizard.steps.marketingMedia.sections'

export const marketingMediaSchema: StepSchema = {
  sections: [
    // Composition pass: 4 peer switches at .third() complete a 3-up row and
    // then strand the 4th alone on its own row (dead space on both sides,
    // confirmed live) — .quarter() instead lets all 4 complete one clean
    // row (this section renders full-width, comfortably past .quarter()'s
    // own 4-up breakpoint). Presentation-only.
    section({ id: 'listing-quality', titleKey: `${S}.listingQuality.title`, icon: Sparkles }).fields([
      field.switch('isFeatured', `${S}.listingQuality.fields.isFeatured.label`).quarter().build(),
      field.switch('isVerified', `${S}.listingQuality.fields.isVerified.label`).quarter().build(),
      field.switch('isPremium', `${S}.listingQuality.fields.isPremium.label`).quarter().build(),
      field.switch('isNewListing', `${S}.listingQuality.fields.isNewListing.label`).quarter().build(),
    ]),

    section({ id: 'listing-copy', titleKey: `${S}.listingCopy.title`, icon: FileText }).fields([
      // Relocated from identity.schema.ts. No dynamic logic, never
      // required, no validation.
      field.textarea('description', `${S}.listingCopy.fields.description.label`)
        .full()
        .rows(3)
        .build(),
      // Relocated from identity.schema.ts. Label and default value are the
      // PDF's exact Greek text — do not translate, trim, reformat, or
      // normalize. The label's en/el translation entries are intentionally
      // identical (verbatim) to honor that rule while still routing it
      // through i18n. `.default(...)` is the field's actual submitted
      // content (not UI chrome) — left as a literal, not a key. Actual
      // on-create default applied via useForm()'s defaultValues in
      // PropertyFormPage.tsx (unchanged from before).
      field.textarea('cDescriptionGr', `${S}.listingCopy.fields.cDescriptionGr.label`)
        .full()
        .rows(3)
        .default('Πατήστε το πλήκτρο κεραυνού στα δεξιά αφού αποθηκεύσετε την αγγελία σας, ώστε να συμπληρωθεί η περιγραφή αυτόματα μέσω του Βοηθού ΑΙ.')
        .build(),
    ]),

    section({
      id: 'internal-only',
      titleKey: `${S}.internalOnly.title`,
      descriptionKey: `${S}.internalOnly.description`,
      icon: Lock,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      // Relocated from identity.schema.ts. No dynamic logic, never
      // required, no validation, no maximum/minimum length.
      field.textarea('cOfficeNotes', `${S}.internalOnly.fields.cOfficeNotes.label`)
        .full()
        .rows(3)
        .build(),
      // Relocated from identity.schema.ts. Label is the PDF's exact Greek
      // text — do not translate; en/el entries for this key are
      // intentionally identical (verbatim).
      field.textarea('cPropertyEvaluatorAI', `${S}.internalOnly.fields.cPropertyEvaluatorAI.label`)
        .full()
        .rows(3)
        .build(),
    ]),

    section({ id: 'media', titleKey: `${S}.media.title`, icon: Camera }).fields([
      // Relocated from identity.schema.ts — now sits directly above its own
      // reveal (cBannerphoto), no longer a cross-step condition. Actual
      // on-create default (true) applied via useForm()'s defaultValues in
      // PropertyFormPage.tsx (unchanged from before). Tooltip text is
      // exactly as specified in the PDF — do not rewrite, translate, or
      // summarize it; en/el entries for this key are intentionally
      // identical (verbatim).
      // Composition pass: .full() (was .half()) — the only field in this
      // section at .half() width, always alone (its reveal, cBannerphoto,
      // is .full()), so it left dead space beside it in every state.
      field.switch('cBanner', `${S}.media.fields.cBanner.label`)
        .full()
        .default(true)
        .tooltip(`${S}.media.fields.cBanner.tooltip`)
        .build(),
      // Visible only while cBanner (now in this same step) is true.
      field.image('cBannerphoto', `${S}.media.fields.cBannerphoto.label`)
        .full()
        .visibleWhen(CBANNER_TRUE)
        .resolvePreviewSrc(id => getWebAssetUrl(id))
        .build(),
      // resolvePreviewSrc: edit mode seeds this field with the record's
      // real stored attachment ids (plain strings), which aren't directly
      // servable URLs — getWebAssetUrl() resolves them for preview display
      // only; the field's submitted value stays the raw id either way.
      field.multiImage('imagesIds', `${S}.media.fields.imagesIds.label`)
        .full()
        .maxFiles(30)
        .maxSize(10 * 1024 * 1024)
        .accept(['image/jpeg', 'image/png', 'image/webp'])
        .helperText(`${S}.media.fields.imagesIds.helperText`)
        .resolvePreviewSrc(id => getWebAssetUrl(id))
        .build(),
    ]),

    // Wave 7 (2026-07-15, Attachments). `documents` is a real hasMany/hasMany
    // relation to the Document entity (contracts, floor plans, certificates)
    // — architecturally distinct from the Attachment-only fields above (see
    // the Wave 7 Design Package). This field holds only newly-picked File
    // objects awaiting upload; already-related documents are separately
    // merged into its value as ExistingFileRef entries on Edit-mode prefill
    // (PropertyEditPage), and removing one marks it for unrelate rather than
    // deleting anything — see document-upload.service.ts.
    section({
      id: 'documents',
      titleKey: `${S}.documents.title`,
      descriptionKey: `${S}.documents.description`,
      icon: Paperclip,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.file('documents', `${S}.documents.fields.documents.label`)
        .full()
        .multiple()
        .maxSize(10 * 1024 * 1024)
        .accept(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf', '.csv', '.md', '.txt', '.zip', 'image/*'])
        .helperText(`${S}.documents.fields.documents.helperText`)
        .build(),
      // Wave 7 (2026-07-15, Attachments). Live entityDefs: type 'file',
      // links.cDocumentassignment confirms belongsTo Attachment — the same
      // simple mechanism as cBannerphoto above, NOT a Document-entity relate
      // (that ambiguity, flagged in the Architecture Proposal, is resolved:
      // no links.cDocumentassignment entry would exist under the
      // relate-through-Document interpretation). 730 real records already
      // use this field. Uploaded via the same uploadPropertyImage() path as
      // cBannerphoto, just a different target field — see
      // attachUploadedMedia() in property-form.transform.ts.
      field.file('cDocumentassignment', `${S}.documents.fields.cDocumentassignment.label`)
        .full()
        .maxSize(10 * 1024 * 1024)
        .accept(['image/*', '.zip', '.pdf', '.odt', '.ods', '.odp', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.rtf', '.csv', '.md', '.txt'])
        .build(),
    ]),
  ],
}
