import type {
  FieldSchema, StepSchema, SectionSchema, GridSpan, ValidationRule, ConditionNode,
  TextField, TextareaField, NumberField, CurrencyField, PercentageField,
  EmailField, PhoneField, UrlField, PasswordField,
  DateField, DateTimeField, TimeField,
  CheckboxField, SwitchField, RadioField, FieldOption,
  SelectField, MultiSelectField, SearchableSelectField, AsyncSelectField, OptionsLoader,
  RelationField, TagsField, RichTextField,
  ImageField, MultiImageField, FileField,
  CoordinatesField, AddressField, HiddenField,
} from './types'

/* ─── Base field builder ──────────────────────────────────────────── */

class FieldBuilder<T extends FieldSchema> {
  protected _s: Partial<T>

  constructor(type: T['type'], key: string, label: string) {
    this._s = { type, key, label } as Partial<T>
  }

  span(span: GridSpan) { this._s.span = span; return this }
  full()    { return this.span({ xs: 12 }) }
  half()    { return this.span({ xs: 12, lg: 6 }) }
  third()   { return this.span({ xs: 12, md: 6, lg: 4 }) }
  quarter() { return this.span({ xs: 12, sm: 6, lg: 3 }) }

  required(msg?: string) {
    this._s.required = true
    if (msg) this.validate([{ type: 'required', message: msg }])
    return this
  }

  optional() { this._s.required = false; return this }

  placeholder(text: string) { this._s.placeholder = text; return this }
  description(text: string) { this._s.description = text; return this }
  helperText(text: string)  { this._s.helperText = text; return this }
  tooltip(text: string)     { this._s.tooltip = text; return this }

  disabled(v: boolean | ((values: Record<string, unknown>) => boolean) = true) {
    this._s.disabled = v; return this
  }
  readOnly(v: boolean | ((values: Record<string, unknown>) => boolean) = true) {
    this._s.readOnly = v; return this
  }

  default(val: unknown) { this._s.defaultValue = val; return this }

  visibleWhen(cond: ConditionNode) { this._s.visibility = cond; return this }

  validate(rules: ValidationRule[]) {
    this._s.validation = [...(this._s.validation ?? []), ...rules]
    return this
  }

  meta(data: Record<string, unknown>) { this._s.meta = { ...this._s.meta, ...data }; return this }

  build(): T { return { ...this._s } as T }
}

/* ─── Type-specific builders ──────────────────────────────────────── */

class TextBuilder extends FieldBuilder<TextField> {
  maxLength(n: number) { (this._s as TextField).maxLength = n; return this }
  counter()            { (this._s as TextField).characterCounter = true; return this }
  prefix(t: string)    { (this._s as TextField).prefix = t; return this }
  suffix(t: string)    { (this._s as TextField).suffix = t; return this }
  autocomplete(a: string) { (this._s as TextField).autocomplete = a; return this }
}

class TextareaBuilder extends FieldBuilder<TextareaField> {
  rows(n: number)   { (this._s as TextareaField).rows = n; return this }
  maxLength(n: number) { (this._s as TextareaField).maxLength = n; return this }
  counter()         { (this._s as TextareaField).characterCounter = true; return this }
}

class NumberBuilder extends FieldBuilder<NumberField> {
  min(n: number)    { (this._s as NumberField).min = n; return this }
  max(n: number)    { (this._s as NumberField).max = n; return this }
  step(n: number)   { (this._s as NumberField).step = n; return this }
  precision(n: number) { (this._s as NumberField).precision = n; return this }
  prefix(t: string) { (this._s as NumberField).prefix = t; return this }
  suffix(t: string) { (this._s as NumberField).suffix = t; return this }
}

class CurrencyBuilder extends FieldBuilder<CurrencyField> {
  currencyCode(code: string) { (this._s as CurrencyField).currencyCode = code; return this }
  currencyField(key: string) { (this._s as CurrencyField).currencyField = key; return this }
  min(n: number)    { (this._s as CurrencyField).min = n; return this }
  max(n: number)    { (this._s as CurrencyField).max = n; return this }
}

class PercentageBuilder extends FieldBuilder<PercentageField> {
  min(n: number)    { (this._s as PercentageField).min = n; return this }
  max(n: number)    { (this._s as PercentageField).max = n; return this }
}

class EmailBuilder extends FieldBuilder<EmailField> {
  maxLength(n: number) { (this._s as EmailField).maxLength = n; return this }
}

class PhoneBuilder extends FieldBuilder<PhoneField> {
  country(code: string) { (this._s as PhoneField).defaultCountry = code; return this }
}

class UrlBuilder extends FieldBuilder<UrlField> {
  maxLength(n: number) { (this._s as UrlField).maxLength = n; return this }
}

class PasswordBuilder extends FieldBuilder<PasswordField> {
  strengthMeter()   { (this._s as PasswordField).showStrengthMeter = true; return this }
  minLength(n: number) { (this._s as PasswordField).minLength = n; return this }
}

class DateBuilder extends FieldBuilder<DateField> {
  min(d: string)    { (this._s as DateField).min = d; return this }
  max(d: string)    { (this._s as DateField).max = d; return this }
}

class DateTimeBuilder extends FieldBuilder<DateTimeField> {
  min(d: string)    { (this._s as DateTimeField).min = d; return this }
  max(d: string)    { (this._s as DateTimeField).max = d; return this }
}

class TimeBuilder extends FieldBuilder<TimeField> {
  format(f: '12h' | '24h') { (this._s as TimeField).format = f; return this }
}

class CheckboxBuilder extends FieldBuilder<CheckboxField> {
  checkboxLabel(t: string) { (this._s as CheckboxField).checkboxLabel = t; return this }
}

class SwitchBuilder extends FieldBuilder<SwitchField> {
  labels(on: string, off: string) {
    const s = this._s as SwitchField
    s.onLabel = on; s.offLabel = off
    return this
  }
}

class RadioBuilder extends FieldBuilder<RadioField> {
  constructor(type: RadioField['type'], key: string, label: string, opts: FieldOption[]) {
    super(type, key, label)
    ;(this._s as RadioField).options = opts
  }
  layout(l: RadioField['layout']) { (this._s as RadioField).layout = l; return this }
}

class SelectBuilder extends FieldBuilder<SelectField> {
  options(opts: FieldOption[]) { (this._s as SelectField).options = opts; return this }
  load(fn: OptionsLoader) { (this._s as SelectField).loadOptions = fn; return this }
  clearable()  { (this._s as SelectField).clearable = true; return this }
}

class MultiSelectBuilder extends FieldBuilder<MultiSelectField> {
  options(opts: FieldOption[]) { (this._s as MultiSelectField).options = opts; return this }
  load(fn: OptionsLoader) { (this._s as MultiSelectField).loadOptions = fn; return this }
  max(n: number)  { (this._s as MultiSelectField).max = n; return this }
  clearable()  { (this._s as MultiSelectField).clearable = true; return this }
}

class SearchableSelectBuilder extends FieldBuilder<SearchableSelectField> {
  options(opts: FieldOption[]) { (this._s as SearchableSelectField).options = opts; return this }
  load(fn: OptionsLoader) { (this._s as SearchableSelectField).loadOptions = fn; return this }
  clearable()  { (this._s as SearchableSelectField).clearable = true; return this }
  creatable()  { (this._s as SearchableSelectField).creatable = true; return this }
}

class AsyncSelectBuilder extends FieldBuilder<AsyncSelectField> {
  constructor(type: AsyncSelectField['type'], key: string, label: string, loader: OptionsLoader) {
    super(type, key, label)
    ;(this._s as AsyncSelectField).loadOptions = loader
  }
  debounce(ms: number)  { (this._s as AsyncSelectField).debounce = ms; return this }
  clearable()  { (this._s as AsyncSelectField).clearable = true; return this }
  defaultOptions(opts: FieldOption[] | true) { (this._s as AsyncSelectField).defaultOptions = opts; return this }
}

class RelationBuilder extends FieldBuilder<RelationField> {
  constructor(type: RelationField['type'], key: string, label: string, entity: string) {
    super(type, key, label)
    ;(this._s as RelationField).entity = entity
  }
  displayField(f: string) { (this._s as RelationField).displayField = f; return this }
  multiple()  { (this._s as RelationField).multiple = true; return this }
  endpoint(url: string) { (this._s as RelationField).searchEndpoint = url; return this }
}

class TagsBuilder extends FieldBuilder<TagsField> {
  options(opts: FieldOption[]) { (this._s as TagsField).options = opts; return this }
  creatable()  { (this._s as TagsField).creatable = true; return this }
  max(n: number) { (this._s as TagsField).max = n; return this }
}

class RichTextBuilder extends FieldBuilder<RichTextField> {
  minHeight(px: number)               { (this._s as RichTextField).minHeight = px;    return this }
  maxLength(n: number)                { (this._s as RichTextField).maxLength = n;     return this }
  toolbar(items: RichTextField['toolbar']) { (this._s as RichTextField).toolbar = items; return this }
}

class ImageBuilder extends FieldBuilder<ImageField> {
  accept(types: string[]) { (this._s as ImageField).accept = types; return this }
  maxSize(bytes: number)  { (this._s as ImageField).maxSize = bytes; return this }
  aspectRatio(r: string)  { (this._s as ImageField).aspectRatio = r; return this }
}

class MultiImageBuilder extends FieldBuilder<MultiImageField> {
  accept(types: string[]) { (this._s as MultiImageField).accept = types; return this }
  maxSize(bytes: number)  { (this._s as MultiImageField).maxSize = bytes; return this }
  maxFiles(n: number)     { (this._s as MultiImageField).maxFiles = n; return this }
}

class FileBuilder extends FieldBuilder<FileField> {
  accept(types: string[]) { (this._s as FileField).accept = types; return this }
  maxSize(bytes: number)  { (this._s as FileField).maxSize = bytes; return this }
  maxFiles(n: number)     { (this._s as FileField).maxFiles = n; return this }
  multiple()              { (this._s as FileField).multiple = true; return this }
}

class AddressBuilder extends FieldBuilder<AddressField> {
  withCoordinates() { (this._s as AddressField).includeCoordinates = true; return this }
  fields(f: AddressField['fields']) { (this._s as AddressField).fields = f; return this }
}

/* ─── Field factory  ─────────────────────────────────────────────── */

export const field = {
  text:            (key: string, label: string) => new TextBuilder('text', key, label),
  textarea:        (key: string, label: string) => new TextareaBuilder('textarea', key, label),
  number:          (key: string, label: string) => new NumberBuilder('number', key, label),
  currency:        (key: string, label: string) => new CurrencyBuilder('currency', key, label),
  percentage:      (key: string, label: string) => new PercentageBuilder('percentage', key, label),
  email:           (key: string, label: string) => new EmailBuilder('email', key, label),
  phone:           (key: string, label: string) => new PhoneBuilder('phone', key, label),
  url:             (key: string, label: string) => new UrlBuilder('url', key, label),
  password:        (key: string, label: string) => new PasswordBuilder('password', key, label),
  date:            (key: string, label: string) => new DateBuilder('date', key, label),
  datetime:        (key: string, label: string) => new DateTimeBuilder('datetime', key, label),
  time:            (key: string, label: string) => new TimeBuilder('time', key, label),
  checkbox:        (key: string, label: string) => new CheckboxBuilder('checkbox', key, label),
  switch:          (key: string, label: string) => new SwitchBuilder('switch', key, label),
  radio:           (key: string, label: string, opts: FieldOption[]) => new RadioBuilder('radio', key, label, opts),
  select:          (key: string, label: string) => new SelectBuilder('select', key, label),
  multiSelect:     (key: string, label: string) => new MultiSelectBuilder('multi-select', key, label),
  searchableSelect:(key: string, label: string) => new SearchableSelectBuilder('searchable-select', key, label),
  asyncSelect:     (key: string, label: string, loader: OptionsLoader) => new AsyncSelectBuilder('async-select', key, label, loader),
  relation:        (key: string, label: string, entity: string) => new RelationBuilder('relation', key, label, entity),
  tags:            (key: string, label: string) => new TagsBuilder('tags', key, label),
  richText:        (key: string, label: string) => new RichTextBuilder('rich-text', key, label),
  image:           (key: string, label: string) => new ImageBuilder('image', key, label),
  multiImage:      (key: string, label: string) => new MultiImageBuilder('multi-image', key, label),
  file:            (key: string, label: string) => new FileBuilder('file', key, label),
  coordinates:     (key: string, label: string) => new FieldBuilder<CoordinatesField>('coordinates', key, label),
  address:         (key: string, label: string) => new AddressBuilder('address', key, label),
  hidden:          (key: string, value?: unknown): HiddenField => ({ type: 'hidden', key, label: '', value }),
}

/* ─── Section factory ────────────────────────────────────────────── */

export function section(config: Omit<SectionSchema, 'fields'>) {
  return {
    fields(fields: FieldSchema[]): SectionSchema {
      return { ...config, fields }
    },
  }
}

/* ─── Step factory ───────────────────────────────────────────────── */

export function step(config: StepSchema): StepSchema {
  return config
}

/** Shorthand: flat field list with no section headers */
export function flatStep(fields: FieldSchema[]): StepSchema {
  return { fields }
}
