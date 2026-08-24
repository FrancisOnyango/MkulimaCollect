export type SectorFieldType =
  | "integer"
  | "decimal"
  | "currency"
  | "quantity"
  | "date"
  | "yes_no"
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "evidence";

export type SectorField = {
  id: string;
  label: string;
  type: SectorFieldType;
  required?: boolean;
  unit?: string;
  options?: string[];
  repeatable?: boolean;
  condition?: {
    fieldId: string;
    equals: unknown;
  };
};

export type SectorSection = {
  id: string;
  title: string;
  fields: SectorField[];
};

export type SectorSchemaDefinition = {
  id: string;
  version: string;
  sector: string;
  title: string;
  sections: SectorSection[];
};
