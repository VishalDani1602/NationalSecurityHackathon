import {
  DEFAULT_CUSTODY_SCENARIO_SEED,
  createCustodyScenario,
} from "../lib/scenario";

export const custodyScenarioSeed = DEFAULT_CUSTODY_SCENARIO_SEED;

export const custodyScenario = createCustodyScenario({
  seed: custodyScenarioSeed,
});

export default custodyScenario;
