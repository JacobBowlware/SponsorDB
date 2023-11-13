using namespace std;
#include <iostream>

bool isValid(string customerNumber)
{
    int alphaCount = 0;
    int digitCount = 0;

    for (int i = 0; i < customerNumber.length(); i++)
    {
        if (isnumber(customerNumber[i]))
        {
            digitCount++;
        }
        else if (isalpha(customerNumber[i]))
        {
            alphaCount++;
        }
    }

    return alphaCount == 2 && digitCount == 4;
}

int main()
{
    string myNumber = "1234a2";

    cout << isValid(myNumber);

    return 1;
}