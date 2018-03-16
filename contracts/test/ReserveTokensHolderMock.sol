pragma solidity 0.4.19;

import '../ReserveTokensHolder.sol';

// @dev ReserveTokensHolderMock mocks current time

contract ReserveTokensHolderMock is ReserveTokensHolder {

    function ReserveTokensHolderMock(address _owner, address _crowdsale, address _token) ReserveTokensHolder(_owner, _crowdsale, _token) public {}

    function getTime() internal view returns (uint256) {
        return mock_date;
    }

    function setMockedTime(uint256 date) public {
        mock_date = date;
    }

    uint256 mock_date = now;
}
