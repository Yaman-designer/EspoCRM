import type { ComponentType } from 'react'
import type { FieldType, FieldComponentProps, FieldRegistration } from './types'

import { TextField }           from './fields/TextField'
import { TextareaField }       from './fields/TextareaField'
import { NumberField }         from './fields/NumberField'
import { CurrencyField }       from './fields/CurrencyField'
import { PercentageField }     from './fields/PercentageField'
import { EmailField }          from './fields/EmailField'
import { PhoneField }          from './fields/PhoneField'
import { UrlField }            from './fields/UrlField'
import { PasswordField }       from './fields/PasswordField'
import { DateField }           from './fields/DateField'
import { DateTimeField }       from './fields/DateTimeField'
import { TimeField }           from './fields/TimeField'
import { CheckboxField }       from './fields/CheckboxField'
import { SwitchField }         from './fields/SwitchField'
import { RadioField }          from './fields/RadioField'
import { SelectField }         from './fields/SelectField'
import { MultiSelectField }    from './fields/MultiSelectField'
import { SearchableSelectField }from './fields/SearchableSelectField'
import { AsyncSelectField }    from './fields/AsyncSelectField'
import { RelationField }       from './fields/RelationField'
import { TagsField }           from './fields/TagsField'
import { RichTextField }       from './fields/RichTextField'
import { ImageField }          from './fields/ImageField'
import { MultiImageField }     from './fields/MultiImageField'
import { FileField }           from './fields/FileField'
import { CoordinatesField }    from './fields/CoordinatesField'
import { AddressField }        from './fields/AddressField'
import { HiddenField }         from './fields/HiddenField'

const REGISTRY = new Map<FieldType, FieldRegistration>()

function register(type: FieldType, component: ComponentType<FieldComponentProps<any>>): void {
  REGISTRY.set(type, { component })
}

/* ─── Default registrations ──────────────────────────────────────── */

register('text',              TextField)
register('textarea',          TextareaField)
register('number',            NumberField)
register('currency',          CurrencyField)
register('percentage',        PercentageField)
register('email',             EmailField)
register('phone',             PhoneField)
register('url',               UrlField)
register('password',          PasswordField)
register('date',              DateField)
register('datetime',          DateTimeField)
register('time',              TimeField)
register('checkbox',          CheckboxField)
register('switch',            SwitchField)
register('radio',             RadioField)
register('select',            SelectField)
register('multi-select',      MultiSelectField)
register('searchable-select', SearchableSelectField)
register('async-select',      AsyncSelectField)
register('relation',          RelationField)
register('tags',              TagsField)
register('rich-text',         RichTextField)
register('image',             ImageField)
register('multi-image',       MultiImageField)
register('file',              FileField)
register('coordinates',       CoordinatesField)
register('address',           AddressField)
register('hidden',            HiddenField)

/* ─── Public API ─────────────────────────────────────────────────── */

/**
 * Looks up a field component by type.
 * Returns null if the type is not registered — the caller should render a fallback.
 */
export function resolveField(type: FieldType): FieldRegistration | null {
  return REGISTRY.get(type) ?? null
}

/**
 * Registers a custom field type or overrides an existing one.
 * Call this in your app's entry point before rendering any forms.
 */
export function registerField(
  type: FieldType | string,
  component: ComponentType<FieldComponentProps<any>>,
): void {
  REGISTRY.set(type as FieldType, { component })
}

export { REGISTRY }
