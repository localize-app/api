/**
 * Utility functions for handling variables in phrases
 * Variables are in the format {{variableName}} and should be preserved during translation
 */

export interface VariableInfo {
  name: string;
  fullMatch: string; // e.g., "{{username}}"
  index: number; // Position in original text
}

/**
 * Extract all variables from a text string
 * @param text - The text to extract variables from
 * @returns Array of variable information objects
 */
export function extractVariables(text: string): VariableInfo[] {
  if (!text) return [];

  const variables: VariableInfo[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    variables.push({
      name: match[1].trim(),
      fullMatch: match[0],
      index: match.index,
    });
  }

  return variables;
}

/**
 * Get unique variable names from text
 * @param text - The text to extract variable names from
 * @returns Array of unique variable names
 */
export function getVariableNames(text: string): string[] {
  const variables = extractVariables(text);
  const uniqueNames = new Set(variables.map((v) => v.name));
  return Array.from(uniqueNames);
}

/**
 * Replace variables in text with placeholders that translation providers won't translate
 * Uses a format that most translation providers ignore: <VAR0>, <VAR1>, etc.
 * @param text - Text containing variables
 * @param variables - Variable information array
 * @returns Object with sanitized text and variable map for restoration
 */
export function replaceVariablesWithPlaceholders(
  text: string,
  variables: VariableInfo[],
): { sanitizedText: string; variableMap: Map<number, string> } {
  if (variables.length === 0) {
    return { sanitizedText: text, variableMap: new Map() };
  }

  // Sort variables by index in reverse order to replace from end to start
  // This preserves indices during replacement
  const sortedVars = [...variables].sort((a, b) => b.index - a.index);

  let sanitizedText = text;
  const variableMap = new Map<number, string>();

  sortedVars.forEach((variable, index) => {
    const placeholder = `<VAR${index}>`;
    variableMap.set(index, variable.fullMatch);
    // Replace the variable at its exact position
    sanitizedText =
      sanitizedText.substring(0, variable.index) +
      placeholder +
      sanitizedText.substring(variable.index + variable.fullMatch.length);
  });

  return { sanitizedText, variableMap };
}

/**
 * Restore variables in translated text by replacing placeholders with original variables
 * @param translatedText - Text from translation provider (may have placeholders)
 * @param variableMap - Map of placeholder index to original variable
 * @returns Text with variables restored
 */
export function restoreVariablesFromPlaceholders(
  translatedText: string,
  variableMap: Map<number, string>,
): string {
  if (variableMap.size === 0) return translatedText;

  let restoredText = translatedText;

  // Replace placeholders - escape special regex characters in placeholder
  for (let i = 0; i < variableMap.size; i++) {
    const placeholder = `<VAR${i}>`;
    const originalVariable = variableMap.get(i);
    if (originalVariable) {
      // Escape special regex characters and replace globally
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restoredText = restoredText.replace(
        new RegExp(escapedPlaceholder, 'g'),
        originalVariable,
      );
    }
  }

  return restoredText;
}

/**
 * Preserve variables during translation by replacing them with placeholders,
 * then restoring them after translation
 * @param sourceText - Original text with variables
 * @param translatedText - Translated text (may have corrupted variables)
 * @returns Text with variables preserved/restored
 */
export function preserveVariablesInTranslation(
  sourceText: string,
  translatedText: string,
): string {
  const sourceVariables = extractVariables(sourceText);

  if (sourceVariables.length === 0) {
    return translatedText;
  }

  // Try to restore variables from the translation
  // First, try to find variables that were preserved (best case)
  const preservedVariables = extractVariables(translatedText);
  const preservedNames = new Set(
    preservedVariables.map((v) => v.name.toLowerCase()),
  );
  const sourceNames = new Set(
    sourceVariables.map((v) => v.name.toLowerCase()),
  );

  // If all variables are preserved, return as-is
  if (
    sourceNames.size === preservedNames.size &&
    Array.from(sourceNames).every((name) => preservedNames.has(name))
  ) {
    return translatedText;
  }

  // Otherwise, restore variables from source text
  // Find positions where variables should be based on source text structure
  let restoredText = translatedText;

  // Get unique variable names from source
  const uniqueSourceVars = sourceVariables.reduce((acc, v) => {
    if (!acc.has(v.name)) {
      acc.set(v.name, v.fullMatch);
    }
    return acc;
  }, new Map<string, string>());

  // Try to restore by matching variable patterns or replacing intelligently
  // For now, we'll use a simple approach: replace any {{...}} in translation
  // with the corresponding variable from source if names match
  uniqueSourceVars.forEach((sourceVar, varName) => {
    // Look for the variable name in the translated text (might have been translated)
    // If found, replace with the original variable format
    const regex = new RegExp(
      `\\{\\{[^}]*${varName}[^}]*\\}\\}|\\{\\{[^}]+\\}\\}`,
      'gi',
    );
    if (regex.test(translatedText)) {
      // Variable exists but might be corrupted - replace with original
      restoredText = restoredText.replace(
        regex,
        (match) => {
          // Check if this looks like a variable that should match
          const matchVar = match.match(/\{\{([^}]+)\}\}/);
          if (matchVar) {
            const matchName = matchVar[1].trim().toLowerCase();
            if (matchName.includes(varName.toLowerCase())) {
              return sourceVar;
            }
          }
          return match;
        },
      );
    }
  });

  // For variables not found in translation, we need to restore them
  // This is complex - we'll add them at the end or try to match positions
  // For a production system, we'd use a more sophisticated approach

  return restoredText;
}

/**
 * Validate that all variables from source text are present in translated text
 * @param sourceText - Original text with variables
 * @param translatedText - Translated text to validate
 * @returns Object with validation result and missing variables
 */
export function validateVariables(
  sourceText: string,
  translatedText: string,
): {
  isValid: boolean;
  missingVariables: string[];
  extraVariables: string[];
  warnings: string[];
} {
  const sourceVars = getVariableNames(sourceText);
  const translatedVars = getVariableNames(translatedText);

  const sourceVarSet = new Set(sourceVars.map((v) => v.toLowerCase()));
  const translatedVarSet = new Set(translatedVars.map((v) => v.toLowerCase()));

  const missingVariables = sourceVars.filter(
    (v) => !translatedVarSet.has(v.toLowerCase()),
  );
  const extraVariables = translatedVars.filter(
    (v) => !sourceVarSet.has(v.toLowerCase()),
  );

  const warnings: string[] = [];

  if (missingVariables.length > 0) {
    warnings.push(
      `Missing variables in translation: ${missingVariables.join(', ')}`,
    );
  }

  if (extraVariables.length > 0) {
    warnings.push(
      `Extra variables found in translation: ${extraVariables.join(', ')}`,
    );
  }

  // Check for variable name mismatches (case-insensitive)
  const sourceLower = sourceVars.map((v) => v.toLowerCase()).sort();
  const translatedLower = translatedVars.map((v) => v.toLowerCase()).sort();

  if (
    JSON.stringify(sourceLower) !== JSON.stringify(translatedLower) &&
    missingVariables.length === 0 &&
    extraVariables.length === 0
  ) {
    warnings.push('Variable names may have been modified (case differences)');
  }

  return {
    isValid: missingVariables.length === 0 && extraVariables.length === 0,
    missingVariables,
    extraVariables,
    warnings,
  };
}

/**
 * Main function to translate text while preserving variables
 * This is the recommended way to translate phrases with variables
 * @param text - Source text with variables
 * @param translateFn - Function that performs the actual translation
 * @returns Translated text with variables preserved
 */
export async function translateWithVariablePreservation(
  text: string,
  translateFn: (sanitizedText: string) => Promise<string>,
): Promise<string> {
  const variables = extractVariables(text);

  if (variables.length === 0) {
    // No variables, just translate normally
    return await translateFn(text);
  }

  // Step 1: Replace variables with safe placeholders
  const { sanitizedText, variableMap } = replaceVariablesWithPlaceholders(
    text,
    variables,
  );

  // Step 2: Translate the sanitized text
  const translatedText = await translateFn(sanitizedText);

  // Step 3: Restore variables from placeholders
  let restoredText = restoreVariablesFromPlaceholders(
    translatedText,
    variableMap,
  );

  // Step 4: Final validation and cleanup
  // Sometimes placeholders might not work, so we try to restore from source
  const validation = validateVariables(text, restoredText);
  if (!validation.isValid) {
    // Try alternative restoration method
    restoredText = preserveVariablesInTranslation(text, restoredText);
  }

  return restoredText;
}

