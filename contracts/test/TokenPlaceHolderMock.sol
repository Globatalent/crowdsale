pragma solidity 0.4.19;

import '../TokenPlaceHolder.sol';

// @dev TokenPlaceHolderMock mocks current block number

contract TokenPlaceHolderMock is TokenPlaceHolder {

    uint mock_time;

    function TokenPlaceHolderMock(address _owner, address _token, address _contribution)
            TokenPlaceHolder(_owner, _token, _contribution) public {
        mock_time = now;
    }

    function getTime() internal view returns (uint) {
        return mock_time;
    }

    function setMockedTime(uint _t) public {
        mock_time = _t;
    }
}
