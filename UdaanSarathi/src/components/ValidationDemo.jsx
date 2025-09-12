import { useValidation } from '../hooks/useValidation'
import * as validators from '../utils/formValidation'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from './ui/Card'
import { Alert } from './ui/Alert'
import { User, Mail, Phone, Lock, Calendar, FileText } from 'lucide-react'

const ValidationDemo = () => {
  const validationRules = {
    name: validators.combine(
      validators.required,
      validators.minLength(2),
      validators.maxLength(50)
    ),
    email: validators.combine(
      validators.required,
      validators.email
    ),
    phone: validators.combine(
      validators.required,
      validators.phone
    ),
    age: validators.combine(
      validators.required,
      validators.min(18),
      validators.max(100)
    ),
    password: validators.combine(
      validators.required,
      validators.minLength(8)
    ),
    confirmPassword: (value, allValues) => {
      if (!value) return 'Please confirm your password'
      if (value !== allValues.password) return 'Passwords do not match'
      return null
    },
    bio: validators.combine(
      validators.required,
      validators.minLength(10),
      validators.maxLength(500)
    )
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    reset,
    submitForm
  } = useValidation({
    name: '',
    email: '',
    phone: '',
    age: '',
    password: '',
    confirmPassword: '',
    bio: ''
  }, validationRules)

  const handleSubmit = async (formValues) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Form submitted successfully!\n' + JSON.stringify(formValues, null, 2))
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Validation Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault()
            submitForm(handleSubmit)
          }} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.name && errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Enter your full name"
                />
              </div>
              {touched.name && errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.email && errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Enter your email address"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={values.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.phone && errors.phone 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Enter your phone number"
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Age Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={values.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  onBlur={() => handleBlur('age')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.age && errors.age 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Enter your age"
                />
              </div>
              {touched.age && errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  value={values.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.password && errors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Enter your password"
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.confirmPassword && errors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Confirm your password"
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Bio Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={values.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  onBlur={() => handleBlur('bio')}
                  rows={4}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.bio && errors.bio 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-brand-blue-bright'
                  } backdrop-blur-sm bg-white/50`}
                  placeholder="Tell us about yourself"
                />
              </div>
              {touched.bio && errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 min-w-[120px]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={reset}
                className="flex-1 min-w-[120px]"
              >
                Reset Form
              </Button>
            </div>

            {/* Validation Status */}
            <div className="mt-4">
              <Alert variant={isValid ? "success" : "warning"}>
                Form Status: {isValid ? "Valid" : "Invalid"}
              </Alert>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            This form demonstrates client-side validation with real-time feedback.
            All fields are required and have specific validation rules.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ValidationDemo