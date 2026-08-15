import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppScreen } from '../../components/AppScreen';
import { TripForm } from '../../components/TripForm';
import { tripsRepository, type TripInput } from '../../src/db';

export default function NewTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (input: TripInput) => {
    const trip = await tripsRepository.createTrip(input);
    router.replace(`/trips/${trip.id}`);
  };

  return (
    <AppScreen title={t('trips.new')}>
      <TripForm submitLabel={t('trips.submitCreate')} onSubmit={handleSubmit} />
    </AppScreen>
  );
}
