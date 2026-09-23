package colaborador

import (
	"errors"
	"testing"
)

func TestNewColaboradorAceitaCargoESetorDinamicos(t *testing.T) {
	col, err := NewColaborador(
		"Maria Souza",
		"maria@example.com",
		"(71) 99999-9999",
		"",
		nil,
		nil,
		StatusAtivo,
		StatusAtivo,
		CargoColaborador("Arquiteta de Soluções"),
		SetorColaborador("Inovação"),
	)
	if err != nil {
		t.Fatalf("NewColaborador() retornou erro para cargo e setor dinâmicos: %v", err)
	}

	if col.Cargo != CargoColaborador("Arquiteta de Soluções") {
		t.Fatalf("cargo = %q, esperado %q", col.Cargo, "Arquiteta de Soluções")
	}
	if col.Setor != SetorColaborador("Inovação") {
		t.Fatalf("setor = %q, esperado %q", col.Setor, "Inovação")
	}
}

func TestNewColaboradorMantemCargoESetorObrigatorios(t *testing.T) {
	tests := []struct {
		nome  string
		cargo CargoColaborador
		setor SetorColaborador
		err   error
	}{
		{"cargo vazio", " ", "Inovação", ErrorInvalidCargo},
		{"setor vazio", "Arquiteta de Soluções", " ", ErrorInvalidSetor},
	}

	for _, tt := range tests {
		t.Run(tt.nome, func(t *testing.T) {
			_, err := NewColaborador(
				"Maria Souza",
				"maria@example.com",
				"(71) 99999-9999",
				"",
				nil,
				nil,
				StatusAtivo,
				StatusAtivo,
				tt.cargo,
				tt.setor,
			)
			if !errors.Is(err, tt.err) {
				t.Fatalf("erro = %v, esperado %v", err, tt.err)
			}
		})
	}
}

func TestUpdateDadosAceitaCargoESetorDinamicos(t *testing.T) {
	col := &Colaborador{Cargo: "Analista", Setor: "TI"}
	cargo := CargoColaborador("Especialista em Dados")
	setor := SetorColaborador("Pesquisa e Desenvolvimento")

	if err := col.UpdateDados(nil, nil, nil, nil, nil, nil, nil, nil, &cargo, &setor); err != nil {
		t.Fatalf("UpdateDados() retornou erro para cargo e setor dinâmicos: %v", err)
	}

	if col.Cargo != cargo {
		t.Fatalf("cargo = %q, esperado %q", col.Cargo, cargo)
	}
	if col.Setor != setor {
		t.Fatalf("setor = %q, esperado %q", col.Setor, setor)
	}
}

func TestParseCargoESetorColaboradorAceitaValoresDinamicos(t *testing.T) {
	cargo, err := ParseCargoColaborador("Especialista em Dados")
	if err != nil {
		t.Fatalf("ParseCargoColaborador() retornou erro: %v", err)
	}
	if cargo != CargoColaborador("Especialista em Dados") {
		t.Fatalf("cargo = %q, esperado %q", cargo, "Especialista em Dados")
	}

	setor, err := ParseSetorColaborador("Pesquisa e Desenvolvimento")
	if err != nil {
		t.Fatalf("ParseSetorColaborador() retornou erro: %v", err)
	}
	if setor != SetorColaborador("Pesquisa e Desenvolvimento") {
		t.Fatalf("setor = %q, esperado %q", setor, "Pesquisa e Desenvolvimento")
	}
}
