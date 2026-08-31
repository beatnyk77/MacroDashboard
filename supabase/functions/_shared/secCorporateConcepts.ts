export const SEC_CORPORATE_SIGNAL_CONCEPTS = {
  cash: [
    'CashAndCashEquivalentsAtCarryingValue',
    'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents',
  ],
  operatingCash: [
    'NetCashProvidedByUsedInOperatingActivities',
  ],
  revenue: [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
  ],
  capex: [
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'PaymentsToAcquirePropertyPlantAndEquipmentAndOtherProductiveAssets',
    'PropertyPlantAndEquipmentAdditions',
  ],
} as const;

export const SEC_CORPORATE_TARGET_CONCEPTS = new Set(
  Object.values(SEC_CORPORATE_SIGNAL_CONCEPTS).flat(),
);
