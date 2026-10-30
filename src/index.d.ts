export type VariableKind = 'interpolate' | 'raw' | 'escape';
export type ConditionOperator = 'truthy' | 'falsy' | 'filled' | 'empty' | 'eq' | 'neq';
export type ConditionJoiner = 'and' | 'or';
export type ConditionLayout = 'inline' | 'block';
export type TemplateType = 'html' | 'text';

export interface TemplateVariable {
  name: string;
  label?: string;
  kind?: VariableKind;
  [key: string]: any;
}

export interface ConditionClause {
  subject: string;
  operator: ConditionOperator;
  value: string;
}

export interface ConditionInput {
  clauses?: Array<Partial<ConditionClause>>;
  joiner?: ConditionJoiner;
  subject?: string;
  operator?: ConditionOperator;
  value?: string | number;
}

export interface NormalizedCondition {
  clauses: ConditionClause[];
  joiner: ConditionJoiner;
}

export interface ParsedCondition extends NormalizedCondition, ConditionClause {}

export interface TemplateVariableMatch {
  start: number;
  end: number;
  name: string;
  kind: 'interpolate' | 'raw';
  raw: string;
}

export interface TemplateConditionMatch extends ParsedCondition {
  start: number;
  end: number;
  raw: string;
  hasElse: boolean;
  layout: ConditionLayout;
  thenHtml: string;
  elseHtml: string;
}

export const VARIABLE_PATH_SOURCE: string;
export const VARIABLE_PATH_RE: RegExp;
export const LIQUID_OUTPUT_RE: RegExp;
export const KIND_INTERPOLATE: 'interpolate';
export const KIND_RAW: 'raw';
export const KIND_ESCAPE: 'escape';

export const TEMPLATE_CONDITION_CLASS: string;
export const TEMPLATE_CONDITION_SUBJECT_ATTR: string;
export const TEMPLATE_CONDITION_OPERATOR_ATTR: string;
export const TEMPLATE_CONDITION_VALUE_ATTR: string;
export const TEMPLATE_CONDITION_CLAUSES_ATTR: string;
export const TEMPLATE_CONDITION_JOINER_ATTR: string;
export const TEMPLATE_CONDITION_HAS_ELSE_ATTR: string;
export const TEMPLATE_CONDITION_LAYOUT_ATTR: string;
export const LAYOUT_INLINE: 'inline';
export const LAYOUT_BLOCK: 'block';
export const CONDITION_LAYOUT_BLOCK_MARKER: string;

export const OPERATOR_TRUTHY: 'truthy';
export const OPERATOR_FALSY: 'falsy';
export const OPERATOR_FILLED: 'filled';
export const OPERATOR_EMPTY: 'empty';
export const OPERATOR_EQ: 'eq';
export const OPERATOR_NEQ: 'neq';
export const DEFAULT_OPERATORS: ConditionOperator[];
export const JOINER_AND: 'and';
export const JOINER_OR: 'or';
export const DEFAULT_JOINER: 'and';
export const DEFAULT_MAX_CLAUSES: number;

export function normalizeVariableKind(kind?: string): 'interpolate' | 'raw';
export function wrapVariable(name: string, kind?: VariableKind): string;
export function resolveVariableLabel(name: string, kind?: VariableKind, variables?: TemplateVariable[]): string;
export function findTemplateMatches(text: string): TemplateVariableMatch[];

export const LIQUID_IF_OPEN_RE: RegExp;
export function normalizeOperator(operator?: string, allowed?: ConditionOperator[]): ConditionOperator;
export function normalizeJoiner(joiner?: string): ConditionJoiner;
export function resolveSubjectLabel(subject: string, variables?: TemplateVariable[]): string;
export function normalizeConditionClauses(input?: ConditionInput, operators?: ConditionOperator[]): NormalizedCondition;
export function formatClauseBadge(clause: Partial<ConditionClause>, variables?: TemplateVariable[]): string;
export function formatJoinerLabel(joiner?: string): string;
export function formatConditionBadge(input: ConditionInput, variables?: TemplateVariable[]): string;
export function buildClauseExpression(clause: Partial<ConditionClause>): string;
export function buildConditionExpression(input: ConditionInput): string;
export function parseSingleClauseExpression(expr: string): ConditionClause | null;
export function parseConditionExpression(expr: string): ParsedCondition | null;
export function readClausesFromAttributes(getAttr: (name: string) => string | null | undefined): NormalizedCondition;
export function wrapConditionEvaluate(input: ConditionInput & { hasElse?: boolean; thenHtml?: string; elseHtml?: string }): string;
export function findConditionMatches(text: string): TemplateConditionMatch[];

export function findUnbalancedTemplateTags(text: string): string | null;
export function validateTemplateHtml(html: string): { ok: boolean; error?: string };

export function renderTemplate(template: string, data?: Record<string, any>, options?: { type?: TemplateType }): string;
export function textToHtml(text: string): string;
export function htmlToText(html: string): string;
