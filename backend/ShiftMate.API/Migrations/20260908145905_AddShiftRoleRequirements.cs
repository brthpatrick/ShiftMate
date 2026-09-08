using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftMate.API.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftRoleRequirements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShiftRoleRequirements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShiftId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    RequiredEmployees = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftRoleRequirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftRoleRequirements_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShiftRoleRequirements_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRoleRequirements_RoleId",
                table: "ShiftRoleRequirements",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRoleRequirements_ShiftId_RoleId",
                table: "ShiftRoleRequirements",
                columns: new[] { "ShiftId", "RoleId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShiftRoleRequirements");
        }
    }
}
