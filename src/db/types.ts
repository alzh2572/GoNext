/** GPS-координаты в десятичных градусах (Decimal Degrees). */
export type DecimalDegrees = {
  latitude: number;
  longitude: number;
};

export type Place = {
  id: number;
  name: string;
  description: string;
  visitlater: boolean;
  liked: boolean;
  dd: DecimalDegrees | null;
  photos: string[];
  createdAt: string;
};

export type PlaceInput = {
  name: string;
  description?: string;
  visitlater?: boolean;
  liked?: boolean;
  dd?: DecimalDegrees | null;
  photos?: string[];
};

export type Trip = {
  id: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  current: boolean;
};

export type TripInput = {
  title: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean;
};

export type TripPlace = {
  id: number;
  tripId: number;
  placeId: number;
  order: number;
  visited: boolean;
  visitDate: string | null;
  notes: string;
  photos: string[];
};

export type TripPlaceInput = {
  tripId: number;
  placeId: number;
  order: number;
  visited?: boolean;
  visitDate?: string | null;
  notes?: string;
  photos?: string[];
};

export type TripPlaceWithPlace = TripPlace & {
  place: Place;
};
