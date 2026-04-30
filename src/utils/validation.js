// src/utils/validation.js
/**
 * Comprehensive validation utilities for Knowledge Factory
 * Makes the application unbreakable with proper client-side validation
 */

/**
 * Email validation - RFC 5322 compliant
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmed = email.trim()
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' }
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., user@example.com)' }
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' }
  }

  // Check for valid domain
  const parts = trimmed.split('@')
  if (parts.length !== 2) {
    return { valid: false, error: 'Email must contain exactly one @ symbol' }
  }

  const [localPart, domain] = parts

  if (localPart.length === 0 || localPart.length > 64) {
    return { valid: false, error: 'Email local part must be 1-64 characters' }
  }

  if (domain.length === 0) {
    return { valid: false, error: 'Email domain is required' }
  }

  // Check domain has at least one dot and valid TLD
  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must include a valid extension (e.g., .com, .org)' }
  }

  const domainParts = domain.split('.')
  const tld = domainParts[domainParts.length - 1]
  
  if (tld.length < 2) {
    return { valid: false, error: 'Email domain extension must be at least 2 characters' }
  }
  
  // TLD must contain only letters (no numbers)
  if (!/^[a-zA-Z]+$/.test(tld)) {
    return { valid: false, error: 'Email domain extension must contain only letters (e.g., .com, .org, .in)' }
  }

  return { valid: true, error: null }
}

/**
 * Name validation
 */
export function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` }
  }

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} is required` }
  }

  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldName} is too long (max 100 characters)` }
  }

  // Allow letters, spaces, hyphens, apostrophes, and dots
  const nameRegex = /^[a-zA-Z\s\-'.]+$/

  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and dots` }
  }

  return { valid: true, error: null }
}

/**
 * Password validation
 */
export function validatePassword(password, fieldName = 'Password') {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: `${fieldName} is required` }
  }

  if (password.length < 8) {
    return { valid: false, error: `${fieldName} must be at least 8 characters` }
  }

  if (password.length > 128) {
    return { valid: false, error: `${fieldName} is too long (max 128 characters)` }
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: `${fieldName} must contain at least one uppercase letter` }
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: `${fieldName} must contain at least one lowercase letter` }
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: `${fieldName} must contain at least one number` }
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: `${fieldName} must contain at least one special character` }
  }

  return { valid: true, error: null }
}

/**
 * UUID validation
 */
export function validateUUID(uuid, fieldName = 'ID') {
  if (!uuid) {
    return { valid: true, error: null } // Optional field
  }

  if (typeof uuid !== 'string') {
    return { valid: false, error: `${fieldName} must be a valid UUID` }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: `${fieldName} must be a valid UUID format` }
  }

  return { valid: true, error: null }
}

/**
 * Tech stack validation
 */
export function validateTechStack(techStack) {
  if (!techStack) {
    return { valid: true, error: null } // Optional field
  }

  if (typeof techStack !== 'string') {
    return { valid: false, error: 'Tech stack must be text' }
  }

  const trimmed = techStack.trim()

  if (trimmed.length > 200) {
    return { valid: false, error: 'Tech stack is too long (max 200 characters)' }
  }

  return { valid: true, error: null }
}

/**
 * Role validation
 */
export function validateRole(role) {
  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Role is required' }
  }

  const validRoles = ['ADMIN', 'TECHNICAL_LEAD', 'INTERN']
  const upperRole = role.toUpperCase()

  if (!validRoles.includes(upperRole)) {
    return { valid: false, error: `Role must be one of: ${validRoles.join(', ')}` }
  }

  return { valid: true, error: null }
}

/**
 * Batch name validation
 */
export function validateBatchName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Batch name is required' }
  }

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Batch name is required' }
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Batch name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Batch name is too long (max 100 characters)' }
  }

  return { valid: true, error: null }
}

/**
 * District validation
 */
export function validateDistrict(district) {
  if (!district || typeof district !== 'string') {
    return { valid: false, error: 'District is required' }
  }

  const trimmed = district.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'District is required' }
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'District name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'District name is too long (max 100 characters)' }
  }

  return { valid: true, error: null }
}

/**
 * Task title validation
 */
export function validateTaskTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Task title is required' }
  }

  const trimmed = title.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Task title is required' }
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Task title must be at least 3 characters' }
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Task title is too long (max 200 characters)' }
  }

  return { valid: true, error: null }
}

/**
 * Task description validation
 */
export function validateTaskDescription(description) {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Task description is required' }
  }

  const trimmed = description.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Task description is required' }
  }

  if (trimmed.length < 10) {
    return { valid: false, error: 'Task description must be at least 10 characters' }
  }

  if (trimmed.length > 5000) {
    return { valid: false, error: 'Task description is too long (max 5000 characters)' }
  }

  return { valid: true, error: null }
}

/**
 * URL validation
 */
export function validateURL(url, fieldName = 'URL') {
  if (!url) {
    return { valid: true, error: null } // Optional field
  }

  if (typeof url !== 'string') {
    return { valid: false, error: `${fieldName} must be text` }
  }

  const trimmed = url.trim()

  if (trimmed.length === 0) {
    return { valid: true, error: null }
  }

  try {
    new URL(trimmed)
    return { valid: true, error: null }
  } catch {
    return { valid: false, error: `${fieldName} must be a valid URL (e.g., https://example.com)` }
  }
}

/**
 * Number validation
 */
export function validateNumber(value, fieldName = 'Value', min = null, max = null) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` }
  }

  const num = Number(value)

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` }
  }

  if (min !== null && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` }
  }

  if (max !== null && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` }
  }

  return { valid: true, error: null }
}

/**
 * Date validation
 */
export function validateDate(date, fieldName = 'Date') {
  if (!date) {
    return { valid: false, error: `${fieldName} is required` }
  }

  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${fieldName} must be a valid date` }
  }

  return { valid: true, error: null }
}

/**
 * Week number validation
 */
export function validateWeekNumber(week) {
  const result = validateNumber(week, 'Week number', 1, 52)
  return result
}

/**
 * Score validation (0-100)
 */
export function validateScore(score, fieldName = 'Score') {
  return validateNumber(score, fieldName, 0, 100)
}

/**
 * Validate entire profile form
 */
export function validateProfileForm(form) {
  const errors = {}

  const nameValidation = validateName(form.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.error
  }

  const emailValidation = validateEmail(form.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error
  }

  const techStackValidation = validateTechStack(form.tech_stack)
  if (!techStackValidation.valid) {
    errors.tech_stack = techStackValidation.error
  }

  const batchIdValidation = validateUUID(form.batch_id, 'Batch ID')
  if (!batchIdValidation.valid) {
    errors.batch_id = batchIdValidation.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate batch form
 */
export function validateBatchForm(form) {
  const errors = {}

  const nameValidation = validateBatchName(form.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.error
  }

  const districtValidation = validateDistrict(form.district)
  if (!districtValidation.valid) {
    errors.district = districtValidation.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate task form
 */
export function validateTaskForm(form) {
  const errors = {}

  const titleValidation = validateTaskTitle(form.title)
  if (!titleValidation.valid) {
    errors.title = titleValidation.error
  }

  const descriptionValidation = validateTaskDescription(form.description)
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error
  }

  const weekValidation = validateWeekNumber(form.week_number)
  if (!weekValidation.valid) {
    errors.week_number = weekValidation.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
