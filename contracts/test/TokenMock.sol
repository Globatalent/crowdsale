pragma solidity 0.4.19;

import '../Token.sol';

// @dev TokenMock mocks current block number

contract TokenMock is Token {

    function TokenMock(address _tokenFactory) Token(_tokenFactory) public {}

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    uint mock_blockNumber = 1;
}
