import { useRouter } from 'expo-router';
import { AppScreen } from '../../components/AppScreen';
import { PlaceForm } from '../../components/PlaceForm';
import { placesRepository, type PlaceInput } from '../../src/db';

export default function NewPlaceScreen() {
  const router = useRouter();

  const handleSubmit = async (input: PlaceInput) => {
    const place = await placesRepository.createPlace(input);
    router.replace(`/places/${place.id}`);
  };

  return (
    <AppScreen title="Новое место">
      <PlaceForm submitLabel="Создать" onSubmit={handleSubmit} />
    </AppScreen>
  );
}
