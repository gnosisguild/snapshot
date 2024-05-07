import { DelegateWithPercent, ExtendedSpace } from '@/helpers/interfaces';
import { DelegationReader } from '@/helpers/delegationV2/delegation';

const SPLIT_DELEGATE_BACKEND_URL = 'https://delegate-api.gnosisguild.org';

type DelegateFromSD = {
  address: string;
  votingPower: number;
  percentOfVotingPower: number;
  delegatorCount: number;
  percentOfDelegators: number;
};

type DelegateDetailsFromSD = {
  votingPower: number;
  percentOfVotingPower: number;
  delegatorCount: number;
  percentOfDelegators: number;
};

const emptyDelegate = (address: string): DelegateWithPercent => ({
  id: address,
  delegatedVotes: '0',
  tokenHoldersRepresentedAmount: 0,
  delegatorsPercentage: 0,
  votesPercentage: 0
});

const getDelegations =
  (space: ExtendedSpace): DelegationReader['getDelegates'] =>
  async (first: number, skip: number, matchFilter: string) => {
    let orderBy = 'power';
    if (matchFilter === 'tokenHoldersRepresentedAmount') {
      orderBy = 'count';
    }

    const splitDelStrategy = space.strategies.find(
      strat => strat.name === 'split-delegation'
    );

    if (!splitDelStrategy) {
      throw new Error('Split delegation strategy not found');
    }

    const response = (await fetch(
      `${SPLIT_DELEGATE_BACKEND_URL}/api/v1/${space.id}/pin/top-delegates?by=${orderBy}&limit=${first}&offset=${skip}`,
      {
        method: 'POST',
        body: JSON.stringify({
          totalSupply: splitDelStrategy.params.totalSupply,
          strategies: splitDelStrategy.params.strategies,
          network: space.network
        })
      }
    ).then(res => res.json())) as { topDelegates: DelegateFromSD[] };

    const formatted: DelegateWithPercent[] = response.topDelegates.map(d => ({
      id: d.address,
      delegatedVotes: d.votingPower.toString(),
      tokenHoldersRepresentedAmount: d.delegatorCount,
      delegatorsPercentage: d.percentOfDelegators,
      votesPercentage: d.percentOfVotingPower
    }));

    return formatted;
  };

const getDelegate =
  (space: ExtendedSpace): DelegationReader['getDelegate'] =>
  async (address: string) => {
    const splitDelStrategy = space.strategies.find(
      strat => strat.name === 'split-delegation'
    );

    if (!splitDelStrategy) {
      throw new Error('Split delegation strategy not found');
    }
    const response = (await fetch(
      `${SPLIT_DELEGATE_BACKEND_URL}/api/v1/${space.id}/pin/delegate/${address}`,
      {
        method: 'POST',
        body: JSON.stringify({
          totalSupply: 10000000,
          strategies: space.strategies,
          network: space.network
        })
      }
    ).then(res => res.json())) as DelegateDetailsFromSD;

    if (response.delegatorCount > 0) return emptyDelegate(address);

    const formatted: DelegateWithPercent = {
      id: address,
      delegatedVotes: response.votingPower.toString(),
      tokenHoldersRepresentedAmount: response.delegatorCount,
      delegatorsPercentage: response.percentOfDelegators,
      votesPercentage: response.percentOfVotingPower
    };

    return formatted;
  };

const getBalance =
  (space: ExtendedSpace): DelegationReader['getBalance'] =>
  async (address: string) => {
    const splitDelStrategy = space.strategies.find(
      strat => strat.name === 'split-delegation'
    );

    if (!splitDelStrategy) {
      throw new Error('Split delegation strategy not found');
    }
    const response = (await fetch(
      `${SPLIT_DELEGATE_BACKEND_URL}/api/v1/${space.id}/pin/delegate/${address}`,
      {
        method: 'POST',
        body: JSON.stringify({
          totalSupply: splitDelStrategy.params.totalSupply,
          strategies: splitDelStrategy.params.strategies,
          network: space.network
        })
      }
    ).then(res => res.json())) as DelegateDetailsFromSD;

    return response.votingPower.toString();
  };

type DelegateToFromDRV2 = {
  delegators: {
    from_address: string;
    delegated_amount: string;
    to_address_own_amount: string;
  }[];
  voteWeightDelegated: string;
  numberOfDelegators: number;
  delegatesOwnVoteWeight: string;
  totalVoteWeight: string;
};

const getDelegatingTo =
  (space: ExtendedSpace): DelegationReader['getDelegatingTo'] =>
  async (address: string) => {
    const splitDelStrategy = space.strategies.find(
      strat => strat.name === 'split-delegation'
    );

    if (!splitDelStrategy) {
      throw new Error('Split delegation strategy not found');
    }
    const response = (await fetch(
      `${SPLIT_DELEGATE_BACKEND_URL}/api/v1/${space.id}/pin/delegate/${address}`,
      {
        body: JSON.stringify({
          totalSupply: splitDelStrategy.params.totalSupply,
          strategies: splitDelStrategy.params.strategies,
          network: space.network
        })
      }
    ).then(res => res.json())) as DelegateToFromDRV2;

    return response.delegators.map(d => d.from_address);
  };

export const getDelegationReader = (
  space: ExtendedSpace
): DelegationReader => ({
  getDelegates: getDelegations(space),
  getDelegate: getDelegate(space),
  getBalance: getBalance(space),
  getDelegatingTo: getDelegatingTo(space)
});