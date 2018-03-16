pragma solidity 0.4.19;


import "./MiniMeToken.sol";
import "./TokenContribution.sol";
import "./SafeMath.sol";
import "./ERC20Token.sol";


contract AdvisorsTokensHolder is Owned {
    using SafeMath for uint256;

    uint256 collectedTokens;
    TokenContribution crowdsale;
    MiniMeToken miniMeToken;

    function AdvisorsTokensHolder(address _owner, address _crowdsale, address _miniMeToken) public {
        owner = _owner;
        crowdsale = TokenContribution(_crowdsale);
        miniMeToken = MiniMeToken(_miniMeToken);
    }

    /// @notice The owner will call this method to extract the tokens
    function collectTokens() public onlyOwner {
        uint256 balance = miniMeToken.balanceOf(address(this));
        uint256 total = collectedTokens.add(balance);

        uint256 finalizedTime = crowdsale.finalizedTime();

        require(finalizedTime > 0 && getTime() > finalizedTime.add(months(2)));

        uint256 canExtract = 0;
        if (getTime() <= finalizedTime.add(months(3))) {
            require(collectedTokens < total.percent(20));
            canExtract = total.percent(20);
        } else if (getTime() > finalizedTime.add(months(3)) && getTime() <= finalizedTime.add(months(4))) {
            require(collectedTokens < total.percent(40));
            canExtract = total.percent(40);
        } else if (getTime() > finalizedTime.add(months(4)) && getTime() <= finalizedTime.add(months(5))) {
            require(collectedTokens < total.percent(60));
            canExtract = total.percent(60);
        } else if (getTime() > finalizedTime.add(months(5)) && getTime() <= finalizedTime.add(months(6))) {
            require(collectedTokens < total.percent(80));
            canExtract = total.percent(80);
        } else {
            canExtract = total;
        }

        canExtract = canExtract.sub(collectedTokens);

        if (canExtract > balance) {
            canExtract = balance;
        }

        collectedTokens = collectedTokens.add(canExtract);
        assert(miniMeToken.transfer(owner, canExtract));

        TokensWithdrawn(owner, canExtract);
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
