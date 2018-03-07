pragma solidity ^0.4.18;

import '../EarlyInvestorsTokensHolder.sol';

// @dev TeamTokensHolderMock mocks current time

contract EarlyInvestorsTokensHolderMock is EarlyInvestorsTokensHolder {

    function EarlyInvestorsTokensHolderMock(address _owner, address _crowdsale, address _token) EarlyInvestorsTokensHolder(_owner, _crowdsale, _token) {}

    function getTime() internal returns (uint256) {
        return mock_date;
    }

    function setMockedTime(uint256 date) public {
        mock_date = date;
    }

    uint256 mock_date = now;
}
