pragma solidity 0.4.19;

import '../AdvisorsTokensHolder.sol';

// @dev TeamTokensHolderMock mocks current time

contract AdvisorsTokensHolderMock is AdvisorsTokensHolder {

    function AdvisorsTokensHolderMock(address _owner, address _crowdsale, address _token) AdvisorsTokensHolder(_owner, _crowdsale, _token) public {}

    function getTime() internal view returns (uint256) {
        return mock_date;
    }

    function setMockedTime(uint256 date) public {
        mock_date = date;
    }

    uint256 mock_date = now;
}
