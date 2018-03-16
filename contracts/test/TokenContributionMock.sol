pragma solidity 0.4.19;

import '../TokenContribution.sol';

// @dev TokenContributionMock mocks current block number

contract TokenContributionMock is TokenContribution {

    function TokenContributionMock() TokenContribution() public {}

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    uint mock_blockNumber = 1;
}
