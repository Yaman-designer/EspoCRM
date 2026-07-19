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

export const marketingMediaSchema: StepSchema = {
  sections: [
    section({ id: 'listing-quality', title: 'Listing Quality', icon: Sparkles }).fields([
      field.switch('isFeatured', 'Featured').third().build(),
      field.switch('isVerified', 'Verified').third().build(),
      field.switch('isPremium', 'Premium').third().build(),
      field.switch('isNewListing', 'New Listing').third().build(),
    ]),

    section({ id: 'listing-copy', title: 'Listing Copy', icon: FileText }).fields([
      // Relocated from identity.schema.ts. No dynamic logic, never
      // required, no validation.
      field.textarea('description', 'Description')
        .full()
        .rows(3)
        .build(),
      // Relocated from identity.schema.ts. Label and default value are the
      // PDF's exact Greek text — do not translate, trim, reformat, or
      // normalize. Actual on-create default applied via useForm()'s
      // defaultValues in PropertyFormPage.tsx (unchanged from before).
      field.textarea('cDescriptionGr', 'Περιγραφή (Ελληνικά) 🇬🇷')
        .full()
        .rows(3)
        .default('Πατήστε το πλήκτρο κεραυνού στα δεξιά αφού αποθηκεύσετε την αγγελία σας, ώστε να συμπληρωθεί η περιγραφή αυτόματα μέσω του Βοηθού ΑΙ.')
        .build(),
    ]),

    section({
      id: 'internal-only',
      title: 'Internal Only',
      description: 'Agent/back-office text — never shown on the public listing.',
      icon: Lock,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      // Relocated from identity.schema.ts. No dynamic logic, never
      // required, no validation, no maximum/minimum length.
      field.textarea('cOfficeNotes', 'Office Notes')
        .full()
        .rows(3)
        .build(),
      // Relocated from identity.schema.ts. Label is the PDF's exact Greek
      // text — do not translate.
      field.textarea('cPropertyEvaluatorAI', 'Αυτόματος Εκτιμητής Ακινήτου')
        .full()
        .rows(3)
        .build(),
    ]),

    section({ id: 'media', title: 'Media', icon: Camera }).fields([
      // Relocated from identity.schema.ts — now sits directly above its own
      // reveal (cBannerphoto), no longer a cross-step condition. Actual
      // on-create default (true) applied via useForm()'s defaultValues in
      // PropertyFormPage.tsx (unchanged from before). Tooltip text is
      // exactly as specified in the PDF — do not rewrite, translate, or
      // summarize it.
      field.switch('cBanner', 'Banner')
        .half()
        .default(true)
        .tooltip('Η ανάρτηση πανό εξασφαλίζει την προμήθεια 100%.')
        .build(),
      // Visible only while cBanner (now in this same step) is true.
      field.image('cBannerphoto', 'Banner Photo')
        .full()
        .visibleWhen(CBANNER_TRUE)
        .resolvePreviewSrc(id => getWebAssetUrl(id))
        .build(),
      // resolvePreviewSrc: edit mode seeds this field with the record's
      // real stored attachment ids (plain strings), which aren't directly
      // servable URLs — getWebAssetUrl() resolves them for preview display
      // only; the field's submitted value stays the raw id either way.
      field.multiImage('imagesIds', 'Property Photos')
        .full()
        .maxFiles(30)
        .maxSize(10 * 1024 * 1024)
        .accept(['image/jpeg', 'image/png', 'image/webp'])
        .helperText('The first photo becomes the cover image.')
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
      title: 'Documents',
      description: 'Contracts, floor plans, certificates — attached to this listing, not shown publicly.',
      icon: Paperclip,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.file('documents', 'Documents')
        .full()
        .multiple()
        .maxSize(10 * 1024 * 1024)
        .accept(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf', '.csv', '.md', '.txt', '.zip', 'image/*'])
        .helperText('Uploaded when you save.')
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
      field.file('cDocumentassignment', 'Assignment Document')
        .full()
        .maxSize(10 * 1024 * 1024)
        .accept(['image/*', '.zip', '.pdf', '.odt', '.ods', '.odp', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.rtf', '.csv', '.md', '.txt'])
        .build(),
    ]),
  ],
}
