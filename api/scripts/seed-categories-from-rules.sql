-- Script para popular a tabela categories com dados do rules.json
-- Execute este script após criar a tabela categories

-- Limpar dados existentes (opcional - descomente se necessário)
-- DELETE FROM categories;

-- Inserir categorias principais (sem parentId)
INSERT INTO categories (id, parent_id, name, slug, kind) VALUES
(100, NULL, 'Alimentação', 'alimentacao', 'spend'),
(200, NULL, 'Transporte', 'transporte', 'spend'),
(300, NULL, 'Saúde', 'saude', 'spend'),
(400, NULL, 'Educação', 'educacao', 'spend'),
(500, NULL, 'Serviços financeiros', 'servicos-financeiros', 'fee'),
(600, NULL, 'Investimentos', 'investimentos', 'invest'),
(700, NULL, 'Transferências', 'transferencias', 'transfer'),
(800, NULL, 'Renda/Salário', 'renda-salario', 'income'),
(810, NULL, 'Moradia/Condomínio', 'moradia-condominio', 'spend'),
(811, NULL, 'Moradia/Aluguel', 'moradia-aluguel', 'spend'),
(900, NULL, 'Lazer', 'lazer', 'spend'),
(1000, NULL, 'Serviços Pessoais', 'servicos-pessoais', 'spend'),
(1200, NULL, 'Tecnologia', 'tecnologia', 'spend'),
(1300, NULL, 'Vestuário', 'vestuario', 'spend'),
(1400, NULL, 'Outros', 'outros', 'spend');

-- Inserir subcategorias (com parentId)
INSERT INTO categories (id, parent_id, name, slug, kind) VALUES
-- Alimentação
(101, 100, 'Alimentação/Supermercado', 'alimentacao-supermercado', 'spend'),
(102, 100, 'Alimentação/Restaurante', 'alimentacao-restaurante', 'spend'),

-- Transporte
(201, NULL, 'Transporte/Combustível', 'transporte-combustivel', 'spend'),
(202, 200, 'Transporte/App', 'transporte-app', 'spend'),
(203, 200, 'Transporte/Onibus', 'transporte-onibus', 'spend'),

-- Serviços financeiros
(502, 500, 'Serviços financeiros/Cartão – Pagamento de fatura', 'servicos-financeiros-cartao-pagamento-fatura', 'transfer'),

-- Investimentos
(601, 600, 'Investimentos/Aporte', 'investimentos-aporte', 'invest'),
(602, 600, 'Investimentos/Rendimentos', 'investimentos-rendimentos', 'income'),
(603, 600, 'Investimentos/Resgate', 'investimentos-resgate', 'invest'),
(604, 600, 'Investimentos/Aplicação', 'investimentos-aplicacao', 'invest'),

-- Transferências
(701, 700, 'Transferências/Interna (Movimentação bancária)', 'transferencias-interna-movimentacao-bancaria', 'transfer'),

-- Saúde
(301, 300, 'Saúde/Consulta médica', 'saude-consulta-medica', 'spend'),
(302, 300, 'Saúde/Farmácia', 'saude-farmacia', 'spend'),
(303, 300, 'Saúde/Plano de saúde', 'saude-plano-saude', 'spend'),

-- Educação
(401, 400, 'Educação/Curso', 'educacao-curso', 'spend'),
(402, 400, 'Educação/Universidade', 'educacao-universidade', 'spend'),

-- Lazer
(901, 900, 'Lazer/Cinema', 'lazer-cinema', 'spend'),
(902, 900, 'Lazer/Streaming', 'lazer-streaming', 'spend'),
(903, 900, 'Lazer/Esportes', 'lazer-esportes', 'spend'),

-- Serviços Pessoais
(1001, 1000, 'Serviços Pessoais/Barbearia', 'servicos-pessoais-barbearia', 'spend'),
(1002, 1000, 'Serviços Pessoais/Estética', 'servicos-pessoais-estetica', 'spend'),

-- Tecnologia
(1201, 1200, 'Tecnologia/Software', 'tecnologia-software', 'spend'),
(1202, 1200, 'Tecnologia/Assinaturas', 'tecnologia-assinaturas', 'spend'),

-- Vestuário
(1301, 1300, 'Vestuário/Roupas', 'vestuario-roupas', 'spend'),
(1302, 1300, 'Vestuário/Calçados', 'vestuario-calcados', 'spend'),

-- Outros
(1401, 1400, 'Outros/Diversos', 'outros-diversos', 'spend');

-- Verificar se as inserções foram bem-sucedidas
SELECT 
    id, 
    parent_id, 
    name, 
    slug, 
    kind,
    CASE 
        WHEN parent_id IS NULL THEN 'Categoria Principal'
        ELSE 'Subcategoria'
    END as tipo
FROM categories 
ORDER BY id;
