

all: build

install:
	pip install -q grpcio-tools grpcio twine

generate: clean
	python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. ./alephprotos/entityextract.proto

build: generate
	python setup.py sdist bdist_wheel

release: build
	twine upload dist/*

clean:
	rm -rf build dist
	# rm alephprotos/*_pb2.py
	# rm alephprotos/*_pb2_grpc.py

.PHONY: build