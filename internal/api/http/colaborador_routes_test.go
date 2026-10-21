package apihttp

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"plantao/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

func TestFinanceiroAcessaSomenteListagemDeColaboradores(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(ctx *gin.Context) { ctx.Set("role", FINANCEIRO_ROLE) })
	router.GET("/colaboradores", middleware.RoleMidware(ADMIN_ROLE, GERENTE_ROLE, COLABORADOR_ROLE, FINANCEIRO_ROLE), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})
	router.GET("/colaboradores/:id", middleware.RoleMidware(ADMIN_ROLE, GERENTE_ROLE, COLABORADOR_ROLE), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})
	router.POST("/colaboradores", middleware.RoleMidware(ADMIN_ROLE, GERENTE_ROLE, COLABORADOR_ROLE), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})
	router.PATCH("/colaboradores/:id", middleware.RoleMidware(ADMIN_ROLE, GERENTE_ROLE, COLABORADOR_ROLE), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})
	router.DELETE("/colaboradores/:id", middleware.RoleMidware(ADMIN_ROLE, GERENTE_ROLE, COLABORADOR_ROLE), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})

	for _, tt := range []struct {
		method string
		path   string
		status int
	}{
		{http.MethodGet, "/colaboradores", http.StatusNoContent},
		{http.MethodGet, "/colaboradores/1", http.StatusForbidden},
		{http.MethodPost, "/colaboradores", http.StatusForbidden},
		{http.MethodPatch, "/colaboradores/1", http.StatusForbidden},
		{http.MethodDelete, "/colaboradores/1", http.StatusForbidden},
	} {
		t.Run(tt.method+" "+tt.path, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, httptest.NewRequest(tt.method, tt.path, nil))
			if recorder.Code != tt.status {
				t.Fatalf("status = %d, esperado %d", recorder.Code, tt.status)
			}
		})
	}
}
