import { Redirect } from 'expo-router';

/** Legacy `/welcome` path — welcome UI lives on auth index (`/`). */
export default function WelcomeRedirect() {
  return <Redirect href="/" />;
}
