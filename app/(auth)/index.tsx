import { Redirect, type Href } from 'expo-router';

export default function AuthIndex() {
  return <Redirect href={'/welcome' as Href} />;
}
