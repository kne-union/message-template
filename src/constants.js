/** 变量路径：标识符，可用 . 访问属性 */
export const VARIABLE_PATH_SOURCE = '[A-Za-z_]\\w*(?:\\.[A-Za-z_]\\w*)*';
export const VARIABLE_PATH_RE = new RegExp(`^${VARIABLE_PATH_SOURCE}$`);

/** Liquid 输出：{{ name }} 或 {{ name | raw }}；不允许 {{- / -}} 与其它 filter */
export const LIQUID_OUTPUT_RE = new RegExp(`\\{\\{\\s*(${VARIABLE_PATH_SOURCE})\\s*(\\|\\s*raw\\s*)?\\}\\}`, 'g');

/** {{ name }}：HTML 渲染时转义 */
export const KIND_INTERPOLATE = 'interpolate';
/** {{ name | raw }}：原样输出 HTML */
export const KIND_RAW = 'raw';
/** 旧配置值，归一为 KIND_RAW */
export const KIND_ESCAPE = 'escape';

/** 条件数据态外层元素 class 与属性 */
export const TEMPLATE_CONDITION_CLASS = 'ck-template-condition';
export const TEMPLATE_CONDITION_SUBJECT_ATTR = 'data-template-condition-subject';
export const TEMPLATE_CONDITION_OPERATOR_ATTR = 'data-template-condition-operator';
export const TEMPLATE_CONDITION_VALUE_ATTR = 'data-template-condition-value';
export const TEMPLATE_CONDITION_CLAUSES_ATTR = 'data-template-condition-clauses';
export const TEMPLATE_CONDITION_JOINER_ATTR = 'data-template-condition-joiner';
export const TEMPLATE_CONDITION_HAS_ELSE_ATTR = 'data-template-condition-has-else';
export const TEMPLATE_CONDITION_LAYOUT_ATTR = 'data-template-condition-layout';

export const LAYOUT_INLINE = 'inline';
export const LAYOUT_BLOCK = 'block';

/** 紧贴在 {% if %} 前的 Liquid 行内注释。渲染时忽略；编辑器用来恢复块级 */
export const CONDITION_LAYOUT_BLOCK_MARKER = '{% # ck-layout:block %}';

/** 算子白名单 */
export const OPERATOR_TRUTHY = 'truthy';
export const OPERATOR_FALSY = 'falsy';
export const OPERATOR_FILLED = 'filled';
export const OPERATOR_EMPTY = 'empty';
export const OPERATOR_EQ = 'eq';
export const OPERATOR_NEQ = 'neq';

export const DEFAULT_OPERATORS = [OPERATOR_TRUTHY, OPERATOR_FALSY, OPERATOR_FILLED, OPERATOR_EMPTY, OPERATOR_EQ, OPERATOR_NEQ];

/** 扁平多条件连接符 */
export const JOINER_AND = 'and';
export const JOINER_OR = 'or';
export const DEFAULT_JOINER = JOINER_AND;
export const DEFAULT_MAX_CLAUSES = 5;
