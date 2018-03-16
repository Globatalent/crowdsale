pragma solidity 0.4.19;

import "./MiniMeToken.sol";
import "./TokenContribution.sol";
import "./SafeMath.sol";
import "./ERC20Token.sol";


contract BountiesTokensHolder is Owned {
    using SafeMath for uint256;

    uint256 collectedTokens;
    TokenContribution contribution;
    MiniMeToken miniMeToken;

    function BountiesTokensHolder(address _owner, address _contribution, address _miniMeToken) public {
        owner = _owner;
        contribution = TokenContribution(_contribution);
        miniMeToken = MiniMeToken(_miniMeToken);
    }

    /// @notice The owner will call this method to extract the tokens
    function collectTokens() public onlyOwner {
        uint256 finalizedTime = contribution.finalizedTime();

        require(finalizedTime > 0 && getTime() > finalizedTime);

        uint256 balance = miniMeToken.balanceOf(address(this));

        collectedTokens = balance;
        miniMeToken.transfer(owner, balance);

        TokensWithdrawn(owner, balance);
    }

    function months(uint256 m) internal pure returns (uint256) {
        return m.mul(30 days);
    }

    function getTime() internal view returns (uint256) {
        return now;
    }


    //////////
    // Safety Methods
    //////////

    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
    function claimTokens(address _token) public onlyOwner {
        require(_token != address(miniMeToken));
        if (_token == 0x0) {
            owner.transfer(this.balance);
            return;
        }

        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(this);
        token.transfer(owner, balance);
        ClaimedTokens(_token, owner, balance);
    }

    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event TokensWithdrawn(address indexed _holder, uint256 _amount);
}
