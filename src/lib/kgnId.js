/**
 * Generate a KGN Case ID in the format: KGN-YYYY-MM-XXXX
 * where XXXX is a 4-digit zero-padded sequence or unique 4-digit number.
 */
export function generateKgnCaseId(sequenceNum = null, date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const seq =
    sequenceNum !== null && sequenceNum !== undefined && !Number.isNaN(Number(sequenceNum))
      ? String(Math.max(1, Number(sequenceNum))).padStart(4, '0')
      : String(Math.floor(1000 + (Date.now() % 9000))).padStart(4, '0');
  return `KGN-${yyyy}-${mm}-${seq}`;
}

