docker build -t country_ex_test .
docker run -ti -v $PWD:/service country_ex_test bash
