import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppScreen } from '../../components/AppScreen';
import { PlaceForm } from '../../components/PlaceForm';
import { placesRepository, type PlaceInput } from '../../src/db';

export default function NewPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (input: PlaceInput) => {
    const place = await placesRepository.createPlace(input);
    router.replace(`/places/${place.id}`);
  };

  return (
    <AppScreen title={t('places.new')}>
      <PlaceForm submitLabel={t('places.submitCreate')} onSubmit={handleSubmit} />
    </AppScreen>
  );
}
