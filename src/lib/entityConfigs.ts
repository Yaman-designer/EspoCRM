export type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'phone'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  placeholder?: string
  options?: FieldOption[]
  rows?: number
}

export interface ColumnConfig {
  key: string
  label: string
}

export interface EntityConfig {
  entityType: string
  title: string
  columns: ColumnConfig[]
  fields: FieldConfig[]
}

// ─── Contact ─────────────────────────────────────────────────────────────────
export const contactConfig: EntityConfig = {
  entityType: 'Contact',
  title: 'Contacts',
  columns: [
    { key: 'name',        label: 'Name'    },
    { key: 'emailAddress', label: 'Email'  },
    { key: 'phoneNumber', label: 'Phone'   },
    { key: 'accountName', label: 'Company' },
  ],
  fields: [
    { name: 'firstName',    label: 'First Name', type: 'text',  placeholder: 'First name'    },
    { name: 'lastName',     label: 'Last Name',  type: 'text',  required: true, placeholder: 'Last name' },
    { name: 'emailAddress', label: 'Email',       type: 'email', placeholder: 'Email address' },
    { name: 'phoneNumber',  label: 'Phone',       type: 'phone', placeholder: 'Phone number'  },
    { name: 'title',        label: 'Job Title',   type: 'text',  placeholder: 'Job title'     },
    { name: 'description',  label: 'Notes',       type: 'textarea', rows: 3 },
  ],
}

// ─── Account (Company) ───────────────────────────────────────────────────────
export const accountConfig: EntityConfig = {
  entityType: 'Account',
  title: 'Companies',
  columns: [
    { key: 'name',        label: 'Name'    },
    { key: 'type',        label: 'Type'    },
    { key: 'phoneNumber', label: 'Phone'   },
    { key: 'website',     label: 'Website' },
  ],
  fields: [
    { name: 'name',         label: 'Company Name', type: 'text',     required: true, placeholder: 'Company name' },
    { name: 'type',         label: 'Type',          type: 'select',   options: [
        { value: 'Customer',  label: 'Customer'  },
        { value: 'Partner',   label: 'Partner'   },
        { value: 'Investor',  label: 'Investor'  },
        { value: 'Reseller',  label: 'Reseller'  },
    ]},
    { name: 'phoneNumber',  label: 'Phone',         type: 'phone',    placeholder: 'Phone number'   },
    { name: 'website',      label: 'Website',       type: 'text',     placeholder: 'https://...'    },
    { name: 'emailAddress', label: 'Email',         type: 'email',    placeholder: 'Email address'  },
    { name: 'description',  label: 'Description',   type: 'textarea', rows: 3 },
  ],
}

// ─── Opportunity (Pipeline) ──────────────────────────────────────────────────
export const opportunityConfig: EntityConfig = {
  entityType: 'Opportunity',
  title: 'Pipeline',
  columns: [
    { key: 'name',        label: 'Deal Name' },
    { key: 'accountName', label: 'Company'   },
    { key: 'stage',       label: 'Stage'     },
    { key: 'amount',      label: 'Amount'    },
    { key: 'closeDate',   label: 'Close Date'},
  ],
  fields: [
    { name: 'name',        label: 'Deal Name',  type: 'text',     required: true, placeholder: 'Deal name' },
    { name: 'accountName', label: 'Company',    type: 'text',     placeholder: 'Company name' },
    { name: 'stage',       label: 'Stage',      type: 'select',   options: [
        { value: 'Prospecting',          label: 'Prospecting'           },
        { value: 'Qualification',        label: 'Qualification'         },
        { value: 'Needs Analysis',       label: 'Needs Analysis'        },
        { value: 'Value Proposition',    label: 'Value Proposition'     },
        { value: 'Proposal/Price Quote', label: 'Proposal / Price Quote'},
        { value: 'Negotiation/Review',   label: 'Negotiation / Review'  },
        { value: 'Closed Won',           label: 'Closed Won'            },
        { value: 'Closed Lost',          label: 'Closed Lost'           },
    ]},
    { name: 'amount',    label: 'Amount',     type: 'number', placeholder: '0.00'      },
    { name: 'closeDate', label: 'Close Date', type: 'date'                             },
    { name: 'description', label: 'Notes',   type: 'textarea', rows: 3               },
  ],
}

// ─── Call ────────────────────────────────────────────────────────────────────
export const callConfig: EntityConfig = {
  entityType: 'Call',
  title: 'Calls',
  columns: [
    { key: 'name',      label: 'Subject'   },
    { key: 'status',    label: 'Status'    },
    { key: 'direction', label: 'Direction' },
    { key: 'dateStart', label: 'Date'      },
  ],
  fields: [
    { name: 'name',      label: 'Subject',    type: 'text',   required: true, placeholder: 'Call subject' },
    { name: 'status',    label: 'Status',     type: 'select', options: [
        { value: 'Planned',   label: 'Planned'   },
        { value: 'Held',      label: 'Held'      },
        { value: 'Not Held',  label: 'Not Held'  },
    ]},
    { name: 'direction', label: 'Direction',  type: 'select', options: [
        { value: 'Outbound', label: 'Outbound' },
        { value: 'Inbound',  label: 'Inbound'  },
    ]},
    { name: 'dateStart',   label: 'Date & Time',         type: 'date'                                  },
    { name: 'duration',    label: 'Duration (minutes)',   type: 'number', placeholder: '30'             },
    { name: 'description', label: 'Description',          type: 'textarea', rows: 3                    },
  ],
}

// ─── Real Estate Request ─────────────────────────────────────────────────────
export const requestConfig: EntityConfig = {
  entityType: 'RealEstateRequest',
  title: 'Requests',
  columns: [
    { key: 'name',             label: 'Title'       },
    { key: 'status',           label: 'Status'      },
    { key: 'assignedUserName', label: 'Assigned To' },
    { key: 'createdAt',        label: 'Created'     },
  ],
  fields: [
    { name: 'name',        label: 'Title',       type: 'text',     required: true, placeholder: 'Request title' },
    { name: 'status',      label: 'Status',      type: 'select',   options: [
        { value: 'New',        label: 'New'        },
        { value: 'Assigned',   label: 'Assigned'   },
        { value: 'In Process', label: 'In Process' },
        { value: 'Converted',  label: 'Converted'  },
        { value: 'Recycled',   label: 'Recycled'   },
        { value: 'Dead',       label: 'Dead'       },
    ]},
    { name: 'description', label: 'Description',  type: 'textarea', rows: 4 },
  ],
}

// ─── Contract ────────────────────────────────────────────────────────────────
export const contractConfig: EntityConfig = {
  entityType: 'EblaContractParty',
  title: 'Contracts',
  columns: [
    { key: 'name',      label: 'Name'    },
    { key: 'status',    label: 'Status'  },
    { key: 'createdAt', label: 'Created' },
  ],
  fields: [
    { name: 'name',        label: 'Contract Name', type: 'text',     required: true, placeholder: 'Contract name' },
    { name: 'status',      label: 'Status',         type: 'select',   options: [
        { value: 'Draft',     label: 'Draft'     },
        { value: 'Active',    label: 'Active'    },
        { value: 'Completed', label: 'Completed' },
    ]},
    { name: 'description', label: 'Description',    type: 'textarea', rows: 3 },
  ],
}