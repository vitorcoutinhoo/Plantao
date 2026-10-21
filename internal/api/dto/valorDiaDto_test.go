package dto

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/gin-gonic/gin/binding"
)

func TestSetValorDiaRequestAceitaZeroEMantemValorObrigatorio(t *testing.T) {
	tests := []struct {
		nome      string
		body      string
		querErro  bool
		querValor float64
	}{
		{nome: "zero", body: `{"tipo_dia":"UTIL","valor":0}`, querValor: 0},
		{nome: "positivo", body: `{"tipo_dia":"UTIL","valor":100}`, querValor: 100},
		{nome: "omitido", body: `{"tipo_dia":"UTIL"}`, querErro: true},
	}

	for _, tt := range tests {
		t.Run(tt.nome, func(t *testing.T) {
			var req SetValorDiaRequest
			if err := json.Unmarshal([]byte(tt.body), &req); err != nil {
				t.Fatal(err)
			}
			err := binding.Validator.ValidateStruct(req)
			if tt.querErro {
				if err == nil {
					t.Fatal("valor omitido deveria ser rejeitado")
				}
				return
			}
			if err != nil {
				t.Fatalf("valor válido foi rejeitado: %v", err)
			}
			if req.Valor == nil || *req.Valor != tt.querValor {
				t.Fatalf("valor não foi preservado: %+v", req.Valor)
			}
		})
	}
}

func TestUpdateValorDiaRequestDistingueOmitidoDeNull(t *testing.T) {
	var omitido UpdateValorDiaRequest
	if err := json.Unmarshal([]byte(`{"valor": 175.50}`), &omitido); err != nil {
		t.Fatal(err)
	}
	if !omitido.Valor.Set || omitido.Valor.Value == nil || omitido.Descricao.Set {
		t.Fatal("campos omitidos foram marcados como presentes")
	}

	var descricaoNula UpdateValorDiaRequest
	if err := json.Unmarshal([]byte(`{"descricao": null}`), &descricaoNula); err != nil {
		t.Fatal(err)
	}
	if !descricaoNula.Descricao.Set || descricaoNula.Descricao.Value != nil {
		t.Fatalf("null não foi preservado: %+v", descricaoNula)
	}
}

func TestUpdateValorDiaRequestPreservaValorNulo(t *testing.T) {
	var req UpdateValorDiaRequest
	if err := json.Unmarshal([]byte(`{"valor": null}`), &req); err != nil {
		t.Fatal(err)
	}
	if !req.Valor.Set || req.Valor.Value != nil {
		t.Fatalf("presença de null não foi preservada: %+v", req)
	}
}

func TestRequestsDetectamCamposDeVigenciaRemovidos(t *testing.T) {
	var post SetValorDiaRequest
	if err := json.Unmarshal([]byte(`{"tipo_dia":"UTIL","valor":100,"vigencia_inicio":"2026-01-01"}`), &post); err != nil {
		t.Fatal(err)
	}
	if !post.HasDeprecatedVigenciaFields() {
		t.Fatal("POST não detectou campo de vigência")
	}

	var patch UpdateValorDiaRequest
	if err := json.Unmarshal([]byte(`{"vigencia_fim":null}`), &patch); err != nil {
		t.Fatal(err)
	}
	if !patch.HasDeprecatedVigenciaFields() {
		t.Fatal("PATCH não detectou campo de vigência")
	}
}

func TestSetValorDiaRequestAceitaDescricaoOpcional(t *testing.T) {
	var req SetValorDiaRequest
	if err := json.Unmarshal([]byte(`{"tipo_dia":"UTIL","valor":100,"descricao":"Dias úteis"}`), &req); err != nil {
		t.Fatal(err)
	}
	if req.Descricao == nil || *req.Descricao != "Dias úteis" {
		t.Fatalf("descrição não foi preservada: %+v", req)
	}
}

func TestUpdateValorDiaRequestRejeitaTipoInvalidoEmDescricao(t *testing.T) {
	var req UpdateValorDiaRequest
	if err := json.Unmarshal([]byte(`{"descricao": 123}`), &req); err == nil {
		t.Fatal("descrição numérica deveria ser rejeitada")
	}
}

func TestResponsesNaoExpoemVigencia(t *testing.T) {
	for _, response := range []any{
		ValorDiaResponse{Id: "id", TipoDia: "UTIL", Valor: 100},
		UpdateValorDiaResponse{Id: "id", TipoDia: "UTIL", Valor: 100},
	} {
		data, err := json.Marshal(response)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(data), "vigencia_") {
			t.Fatalf("resposta expôs vigência: %s", data)
		}
	}
}
