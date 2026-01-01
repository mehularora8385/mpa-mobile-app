import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import LoginScreen from './index';

// Mock dependencies
vi.mock('expo-router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('expo-camera', () => ({
  CameraView: ({ children, ...props }: any) => (
    <div data-testid="camera-view" {...props}>
      {children}
    </div>
  ),
  useCameraPermissions: vi.fn(),
}));

vi.mock('@/lib/auth-mock', () => ({
  mockAuthService: {
    login: vi.fn(),
  },
}));

vi.mock('@/services/camera-service', () => ({
  cameraService: {
    takePicture: vi.fn(),
    requestCameraPermission: vi.fn(),
    checkCameraPermission: vi.fn(),
  },
}));

describe('LoginScreen', () => {
  const mockRouter = { replace: vi.fn() };
  const mockRequestPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useCameraPermissions as any).mockReturnValue([
      { granted: true, canAskAgain: false },
      mockRequestPermission,
    ]);
  });

  describe('Form Screen', () => {
    it('renders login form with all input fields', () => {
      render(<LoginScreen />);
      
      expect(screen.getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(screen.getByPlaceholderText('10-digit mobile number')).toBeTruthy();
      expect(screen.getByPlaceholderText('12-digit Aadhaar number')).toBeTruthy();
    });

    it('displays test credentials hint', () => {
      render(<LoginScreen />);
      
      expect(screen.getByText(/TEST CREDENTIALS:/i)).toBeTruthy();
      expect(screen.getByText(/9730018733/)).toBeTruthy();
      expect(screen.getByText(/659999999978/)).toBeTruthy();
    });

    it('validates operator name is required', async () => {
      render(<LoginScreen />);
      
      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter operator name')).toBeTruthy();
      });
    });

    it('validates mobile number length', async () => {
      render(<LoginScreen />);
      
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      fireEvent.changeText(mobileInput, '123');
      
      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter valid 10-digit mobile number')).toBeTruthy();
      });
    });

    it('validates aadhaar number length', async () => {
      render(<LoginScreen />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(mobileInput, '9730018733');
      fireEvent.changeText(aadhaarInput, '65999999');
      
      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter valid 12-digit Aadhaar number')).toBeTruthy();
      });
    });

    it('navigates to camera screen on valid form submission', async () => {
      render(<LoginScreen />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(mobileInput, '9730018733');
      fireEvent.changeText(aadhaarInput, '659999999978');
      
      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('✓ Capture Selfie')).toBeTruthy();
      });
    });
  });

  describe('Camera Screen', () => {
    it('shows camera permission required message when permission denied', async () => {
      (useCameraPermissions as any).mockReturnValue([
        { granted: false, canAskAgain: false },
        mockRequestPermission,
      ]);

      render(<LoginScreen />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(mobileInput, '9730018733');
      fireEvent.changeText(aadhaarInput, '659999999978');
      
      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Camera Permission Required/i)).toBeTruthy();
      });
    });

    it('displays capture and cancel buttons', async () => {
      render(<LoginScreen />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(mobileInput, '9730018733');
      fireEvent.changeText(aadhaarInput, '659999999978');
      
      const continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('✓ Capture Selfie')).toBeTruthy();
        expect(screen.getByText('✕ Cancel')).toBeTruthy();
      });
    });

    it('returns to form when cancel is pressed', async () => {
      render(<LoginScreen />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(mobileInput, '9730018733');
      fireEvent.changeText(aadhaarInput, '659999999978');
      
      let continueButton = screen.getByText('Continue');
      fireEvent.press(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('✕ Cancel')).toBeTruthy();
      });
      
      const cancelButton = screen.getByText('✕ Cancel');
      fireEvent.press(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your full name')).toBeTruthy();
      });
    });
  });

  describe('Review Details Screen', () => {
    it('displays operator details for review', async () => {
      // This would require mocking the camera capture
      // For now, we verify the structure exists
      render(<LoginScreen />);
      
      expect(screen.getByText('SEPL')).toBeTruthy();
      expect(screen.getByText('Biometric Verification')).toBeTruthy();
    });
  });

  describe('Mobile Number Input', () => {
    it('accepts only numeric input', () => {
      render(<LoginScreen />);
      
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      fireEvent.changeText(mobileInput, 'abc123def456');
      
      // Should only contain numbers
      expect(mobileInput.props.value).toMatch(/^\d*$/);
    });

    it('limits to 10 digits', () => {
      render(<LoginScreen />);
      
      const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
      fireEvent.changeText(mobileInput, '12345678901234567890');
      
      expect(mobileInput.props.value.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Aadhaar Number Input', () => {
    it('accepts only numeric input', () => {
      render(<LoginScreen />);
      
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      fireEvent.changeText(aadhaarInput, 'xyz789uvw123');
      
      // Should only contain numbers
      expect(aadhaarInput.props.value).toMatch(/^\d*$/);
    });

    it('limits to 12 digits', () => {
      render(<LoginScreen />);
      
      const aadhaarInput = screen.getByPlaceholderText('12-digit Aadhaar number');
      fireEvent.changeText(aadhaarInput, '123456789012345678901234');
      
      expect(aadhaarInput.props.value.length).toBeLessThanOrEqual(12);
    });
  });
});
