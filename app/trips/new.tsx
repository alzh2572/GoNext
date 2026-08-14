import { useRouter } from 'expo-router';
import { AppScreen } from '../../components/AppScreen';
import { TripForm } from '../../components/TripForm';
import { tripsRepository, type TripInput } from '../../src/db';

export default function NewTripScreen() {
  const router = useRouter();

  const handleSubmit = async (input: TripInput) => {
    const trip = await tripsRepository.createTrip(input);
    router.replace(`/trips/${trip.id}`);
  };

  return (
    <AppScreen title="Новая поездка">
      <TripForm submitLabel="Создать" onSubmit={handleSubmit} />
    </AppScreen>
  );
}
