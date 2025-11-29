/**
 * Example usage of FormBuilder with placement, sizing, and spacing controls
 * This demonstrates all layout options available
 */

import { FormBuilder, FormConfig } from "./form-builder"

// Example: Patient Registration Form with custom layout
export const patientRegistrationForm: FormConfig = {
  id: "patient-registration",
  title: "Patient Registration",
  description: "Register a new patient in the system",
  layout: "two-column",
  gap: "lg",
  fields: [
    // Full width header field
    {
      id: "patient-name",
      name: "patientName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter patient's full legal name",
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      help: {
        content: "Enter exactly as it appears on government-issued ID",
        title: "Name Format",
      },
      layout: {
        colSpan: 12, // Full width across both columns
        size: "md",
        margin: { bottom: "md" },
      },
    },
    // Two-column layout
    {
      id: "date-of-birth",
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      validation: { required: true },
      layout: {
        colSpan: 6, // Half width (6 of 12 columns)
        size: "md",
      },
    },
    {
      id: "gender",
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
        { label: "Prefer not to say", value: "prefer-not-to-say" },
      ],
      validation: { required: true },
      layout: {
        colSpan: 6, // Half width
        size: "md",
      },
    },
    // Full width address
    {
      id: "address",
      name: "address",
      label: "Street Address",
      type: "text",
      layout: {
        colSpan: 12,
        size: "md",
        margin: { top: "md" },
      },
    },
    // Three-column layout for city, state, zip
    {
      id: "city",
      name: "city",
      label: "City",
      type: "text",
      layout: {
        colSpan: 4, // One third width
        size: "md",
      },
    },
    {
      id: "state",
      name: "state",
      label: "State",
      type: "select",
      options: [
        { label: "California", value: "CA" },
        { label: "New York", value: "NY" },
        { label: "Texas", value: "TX" },
        // ... more states
      ],
      layout: {
        colSpan: 4,
        size: "md",
      },
    },
    {
      id: "zip",
      name: "zipCode",
      label: "ZIP Code",
      type: "text",
      validation: {
        pattern: "^\\d{5}(-\\d{4})?$",
      },
      layout: {
        colSpan: 4,
        size: "md",
      },
    },
    // Contact info - two columns
    {
      id: "phone",
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "(555) 123-4567",
      validation: {
        required: true,
        pattern: "^[\\d\\s\\-\\(\\)]+$",
      },
      layout: {
        colSpan: 6,
        size: "md",
        margin: { top: "md" },
      },
    },
    {
      id: "email",
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "patient@example.com",
      validation: {
        required: true,
        pattern: "^[^@]+@[^@]+\\.[^@]+$",
      },
      layout: {
        colSpan: 6,
        size: "md",
        margin: { top: "md" },
      },
    },
    // Large textarea for notes
    {
      id: "notes",
      name: "notes",
      label: "Additional Notes",
      type: "textarea",
      placeholder: "Any additional information about the patient...",
      layout: {
        colSpan: 12,
        size: "lg",
        margin: { top: "md" },
      },
    },
    // Checkbox with custom width
    {
      id: "consent",
      name: "consent",
      label: "Consent",
      type: "checkbox",
      description: "I consent to the terms and conditions",
      validation: { required: true },
      layout: {
        colSpan: 12,
        margin: { top: "lg" },
        width: "auto",
      },
    },
  ],
  submitLabel: "Register Patient",
  cancelLabel: "Cancel",
  showCancel: true,
}

// Example usage in a component:
/*
function PatientRegistrationPage() {
  const handleSubmit = async (data: Record<string, unknown>) => {
    console.log("Patient data:", data)
    // Save to database, etc.
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Patient Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <FormBuilder
          config={patientRegistrationForm}
          onSubmit={handleSubmit}
          onCancel={() => console.log("Cancelled")}
        />
      </CardContent>
    </Card>
  )
}
*/

