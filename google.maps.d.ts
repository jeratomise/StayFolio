declare namespace google.maps.places {
  class Autocomplete {
    constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
    addListener(event: string, handler: () => void): void;
    getPlace(): PlaceResult;
  }
  interface AutocompleteOptions {
    types?: string[];
    fields?: string[];
    componentRestrictions?: { country: string | string[] };
  }
  interface PlaceResult {
    name?: string;
    formatted_address?: string;
    address_components?: AddressComponent[];
  }
  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }
}
