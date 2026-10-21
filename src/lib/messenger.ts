import { VapeProduct, FlavorVariant } from '@/types/vape';

export const MESSENGER_CONFIG = {
  /**
   * Facebook / Messenger handle of the owner
   */
  ownerHandle: 'rashard.seno',

  /**
   * Universal Messenger direct link:
   * Opens native Messenger app on mobile or Messenger web on desktop with prefilled text
   */
  mMeUrl: 'https://m.me/rashard.seno',

  /**
   * Direct Facebook Profile fallback
   */
  facebookProfileUrl: 'https://www.facebook.com/rashard.seno#',
};

/**
 * Builds a formatted live-stock reservation message
 */
export function generateReservationMessage({
  product,
  flavors,
  customQty,
}: {
  product: VapeProduct;
  flavors: FlavorVariant[];
  customQty?: number;
}): string {
  const flavorNames =
    flavors.length > 0
      ? flavors.map((f) => f.name).join(', ')
      : 'Any In-Stock Flavor';

  const qty = customQty || (flavors.length > 0 ? flavors.length : 1);
  const totalPrice = product.price * qty;

  return [
    'Hi Rash Vape! Inquiring on live stock availability to reserve:',
    `• Product: ${product.brand} - ${product.name}`,
    `• Flavor(s): ${flavorNames}`,
    `• Qty: ${qty}`,
    `• Est. Price: ₱${totalPrice.toLocaleString()}`,
    'Are these ready for same-day delivery / store pickup? Thank you!',
  ].join('\n');
}

/**
 * Automates the sending process:
 * 1. Copies the reservation message to clipboard as a reliable backup
 * 2. Launches Facebook Messenger directly to the owner's chat with the message pre-filled
 * 3. The user simply taps the 'Send' button on Messenger!
 */
export function openMessengerReservation(message: string): { success: boolean; url: string } {
  const encodedText = encodeURIComponent(message);
  const messengerUrl = `${MESSENGER_CONFIG.mMeUrl}?text=${encodedText}`;

  // Copy to clipboard immediately (safeguard in case personal FB web drops url params)
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(message);
    } catch (err) {
      console.warn('Clipboard write fallback error:', err);
    }
  }

  // Open Messenger in a new tab/window
  if (typeof window !== 'undefined') {
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  }

  return { success: true, url: messengerUrl };
}
