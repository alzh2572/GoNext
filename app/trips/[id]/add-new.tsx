import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppScreen } from '../../../components/AppScreen';
import { PlaceForm } from '../../../components/PlaceForm';
import {
  placesRepository,
  tripPlacesRepository,
  type PlaceInput,
} from '../../../src/db';

export default function AddNewPlaceToTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const handleSubmit = async (input: PlaceInput) => {
    const place = await placesRepository.createPlace(input);
    const order = await tripPlacesRepository.getNextOrder(tripId);
    await tripPlacesRepository.addTripPlace({
      tripId,
      placeId: place.id,
      order,
    });
    router.replace(`/trips/${tripId}`);
  };

  return (
    <AppScreen title="Новое место в поездке">
      <PlaceForm submitLabel="Создать и добавить" onSubmit={handleSubmit} />
    </AppScreen>
  );
}
