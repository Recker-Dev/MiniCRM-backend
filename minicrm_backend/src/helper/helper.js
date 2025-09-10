const operatorMap = {
    '>': 'gt',
    '<': 'lt',
    '=': 'equals',
    '!=': 'not',
    '>=': 'gte',
    '<=': 'lte'
};

// helper: cast value based on attribute type
function castValue(attribute, val) {
    // numeric fields
    if (['spend', 'visit', 'total_spend'].includes(attribute)) return Number(val);

    // date fields
    if (['last_order_date', "createdAt"].includes(attribute)) {
        const days = Number(val);
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() - days);

        // For '<' operator: last_order_date < targetDate (inactive more than X days)
        return targetDate;
    }

    // boolean fields
    if (val === 'true' || val === 'false') return val === 'true';

    // string by default
    return val;
}

function buildPrismaFilter(ruleGroup) {
    if (!ruleGroup || !ruleGroup.rules) return {};

    const combinatorKey = ruleGroup.combinator === 'AND' ? 'AND' : 'OR';

    const conditions = ruleGroup.rules.map(rule => {
        if (rule.rules) {
            // nested group
            return buildPrismaFilter(rule);
        } else {
            const prismaOperator = operatorMap[rule.operator];
            return {
                [rule.attribute]: {
                    [prismaOperator]: castValue(rule.attribute, rule.value)
                }
            };
        }
    });

    return { [combinatorKey]: conditions };
}

module.exports = { buildPrismaFilter };
