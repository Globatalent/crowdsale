pragma solidity 0.4.19;

import '../AirdropTokensHolder.sol';

// @dev TeamTokensHolderMock mocks current time

contract AirdropTokensHolderMock is AirdropTokensHolder {

    function AirdropTokensHolderMock(address _owner, address _crowdsale, address _token) AirdropTokensHolder(_owner, _crowdsale, _token) public {}

    function getTime() internal view returns (uint256) {
        return mock_date;
    }

    function setMockedTime(uint256 date) public {
        mock_date = date;
    }

    uint256 mock_date = now;
}
